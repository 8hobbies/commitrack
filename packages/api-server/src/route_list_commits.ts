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

interface QueryStringSchemaInterface {
  num_of_commits: number;
}

interface ParamsSchemaInterface {
  repository: string;
  branch: string;
}

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
              // The last time commits were retrieved for this repo/branch
              last_commit_retrieval_time: { type: "integer", minimum: 1 },
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

      reply.code(200).send({
        commits: queryResult.commits.map((commit) => ({
          ...commit,
          retrieval_time: commit.retrieval_time.getTime(),
        })),
        last_commit_retrieval_time: queryResult.last_commit_retrieval_time,
      });
    },
  );
};

export default plugin;
