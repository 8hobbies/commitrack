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

import { PrismaClient } from "@prisma/client";
import fastify from "./index.ts";

const prisma = new PrismaClient();

describe("/health", () => {
  test("Return 204", async () => {
    const response = await fastify.inject({
      method: "GET",
      url: "/health",
    });
    expect(response.statusCode).toBe(204);
  });
});

describe("/new", () => {
  beforeEach(async () => {
    await prisma.$queryRaw`delete from branches`;
  });

  const newFirstPathComp = "new" as const;
  for (const [name, payload] of [
    ["empty", {}],
    ["missing repository", { branch: "master" }],
    ["missing branch", { repository: "https://example/my/repo" }],
  ] as const) {
    test(`Return 400 with invalid payload: ${name}`, async () => {
      const response = await fastify.inject({
        method: "PUT",
        url: `/${newFirstPathComp}`,
        headers: { "content-type": "application/json" },
        body: payload,
      });

      expect(response.statusCode).toBe(400);
    });
  }

  test("Return 204 with valid payload", async () => {
    const response = await fastify.inject({
      method: "PUT",
      url: `/${newFirstPathComp}`,
      headers: { "content-type": "application/json" },
      body: { repository: "https://example/my/repo", branch: "master" },
    });

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe("");
  });
});
