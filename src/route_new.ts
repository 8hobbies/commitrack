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
  branchNamePattern,
  commonMaxLength,
  getRemoteGitCommit,
} from "./common.js";
import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";

// eslint-disable-next-line @typescript-eslint/require-await
const plugin: FastifyPluginAsyncJsonSchemaToTs = async function (fastify, _) {
  fastify.post(
    "/new",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            repository: {
              type: "string",
              minLength: 1,
              maxLength: commonMaxLength,
            },
            branch: {
              type: "string",
              pattern: branchNamePattern,
              minLength: 1,
              maxLength: commonMaxLength,
            },
          },
          required: ["repository", "branch"],
        },
        response: {
          201: {
            type: "null",
          },
          403: {
            type: "object",
            properties: {
              error: {
                type: "object",
                properties: {
                  message: { type: "string" }, // Human-readable error
                  type: {
                    type: "string",
                    enum: [
                      "commit", // fail to get commit
                      "creation", // fail to create the db entry
                    ],
                  }, // Error code
                },
              },
            },
            required: ["error"],
          },
        },
      },
    } as const,
    async (request, reply) => {
      const { repository, branch } = request.body;
      const commitHash = await getRemoteGitCommit(repository, branch);
      const retrievalTime = new Date();
      if (commitHash == null) {
        reply.code(403).send({
          error: {
            message: `Failed to obtain commit from the branch "${branch}" of the repository "${repository}".`,
            type: "commit",
          },
        });
        return;
      }

      try {
        await fastify.prisma.branches.create({
          data: {
            repository,
            branch,
            last_commit_retrieval_time: retrievalTime,
            commits: {
              create: {
                retrieval_time: retrievalTime,
                commit_hash: commitHash,
              },
            },
          },
        });
      } catch (error: unknown) {
        console.log({ error });
        reply.code(403).send({
          error: {
            message: `Failed to add the "${branch}" of the repository "${repository}". Likely it already exists.`,
            type: "creation",
          },
        });
        return;
      }
      reply.code(201).send();
    },
  );
};

export default plugin;
