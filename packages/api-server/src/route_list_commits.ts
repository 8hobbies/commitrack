/** @license AGPL-3.0-or-later
 *
 * Copyright(C) 2025 8 Hobbies, LLC
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  branchMaxLength,
  branchNamePattern,
  repoUrlMaxLength,
} from "./common.js";
import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";
import { createClient } from "redis";
import { isArrayOf } from "@8hobbies/utils";

interface QueryStringSchemaInterface {
  num_of_commits: number;
}

interface ParamsSchemaInterface {
  repository: string;
  branch: string;
}

const cacheLifeSpan = parseInt(
  process.env.CACHE_LIFE_SPAN ?? (60 * 60 * 3).toString(),
); // 3 hours default cache life
const redisClient = createClient({
  /* v8 ignore start */
  url: process.env.CACHE_CONNECTION_URL ?? "redis://localhost:6379",
  /* v8 ignore end */
});
redisClient.on("error", (err) => {
  /* v8 ignore start */
  console.log("Redis Client Error", err);
  /* v8 ignore end */
});
await redisClient.connect();

// eslint-disable-next-line @typescript-eslint/require-await
const plugin: FastifyPluginAsyncJsonSchemaToTs = async function (fastify, _) {
  fastify.get<{
    Querystring: QueryStringSchemaInterface;
    Params: ParamsSchemaInterface;
  }>(
    "/list-commits/:repository/:branch",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            num_of_commits: { type: "integer", minimum: 1 },
          },
          required: ["num_of_commits"],
        },
        params: {
          type: "object",
          properties: {
            repository: {
              type: "string",
              minLength: 1,
              maxLength: repoUrlMaxLength,
            },
            branch: {
              type: "string",
              pattern: branchNamePattern,
              minLength: 1,
              maxLength: branchMaxLength,
            },
          },
          required: ["repository", "branch"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              commits: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    commit_hash: { type: "string", maxLength: 40 },
                    retrieval_time: { type: "integer", minimum: 1 },
                  },
                  required: ["commit_hash", "retrieval_time"],
                },
              },
              // The last timestamp commits were retrieved for this repo/branch.
              // Unit is milliseconds.
              last_commit_retrieval_time: { type: "integer", minimum: 0 },
            },
          },
          404: {
            type: "object",
            properties: {
              error: {
                type: "object",
                properties: {
                  message: { type: "string" }, // Human-readable error
                },
              },
            },
            required: ["error"],
          },
        },
      },
    } as const,
    async (request, reply) => {
      const { repository, branch } = request.params;
      const { num_of_commits } = request.query;
      const cacheKey = JSON.stringify([repository, branch]);

      /** Gets the cached result. Returns null if no useful cache is available.
       */
      async function getCachedResult(): Promise<object | null> {
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult === null) {
          return null;
        }

        const cachedResultJson: unknown = JSON.parse(cachedResult);
        if (
          typeof cachedResultJson !== "object" ||
          cachedResultJson === null ||
          !("commits" in cachedResultJson) ||
          !isArrayOf(cachedResultJson.commits, "object")
        ) {
          console.error(`Unknown cache result: ${cachedResult}`);
          return null;
        }

        // TODO: Optimize this part because a request can always indicates a
        // large number of commits, which results in no cache hit.
        if (num_of_commits > cachedResultJson.commits.length) {
          // We need more commits.
          return null;
        }

        // Reset the cache life span.
        await redisClient.expire(cacheKey, cacheLifeSpan, "GT");
        return cachedResultJson;
      }

      const cachedResult = await getCachedResult();
      if (cachedResult !== null) {
        // cache hit
        reply.code(200).send(cachedResult);
        return;
      }

      const queryResult = await fastify.prisma.branches.findFirst({
        where: {
          repository,
          branch,
        },
        include: {
          commits: {
            select: {
              commit_hash: true,
              retrieval_time: true,
            },
            take: num_of_commits,
            orderBy: {
              retrieval_time: "desc",
            },
          },
        },
      });

      if (queryResult == null) {
        reply.code(404).send({
          error: {
            message: `Failed to get commits of the "${branch}" of the repository "${repository}".`,
          },
        });
        return;
      }

      const responsePayload = {
        commits: queryResult.commits.map((commit) => ({
          ...commit,
          retrieval_time: commit.retrieval_time.getTime(),
        })),
        last_commit_retrieval_time:
          queryResult.last_commit_retrieval_time.getTime(),
      };
      reply.code(200).send(responsePayload);
      await redisClient.set(cacheKey, JSON.stringify(responsePayload), {
        EX: cacheLifeSpan,
      });
    },
  );
};

export default plugin;
