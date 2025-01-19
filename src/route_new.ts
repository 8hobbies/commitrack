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

import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";

// eslint-disable-next-line @typescript-eslint/require-await
const plugin: FastifyPluginAsyncJsonSchemaToTs = async function (fastify, _) {
  fastify.put(
    "/new",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            repository: { type: "string" },
            branch: { type: "string" },
          },
          required: ["repository", "branch"],
        },
        response: {
          204: {
            type: "null",
          },
        },
      },
    } as const,
    async (request, reply) => {
      const { repository, branch } = request.body;
      console.log(repository, branch);
      reply.code(204).send();
    },
  );
};

export default plugin;
