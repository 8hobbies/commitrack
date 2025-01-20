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

  test("Return 204 with valid payload and valid git repo, branch", async () => {
    const response = await fastify.inject({
      method: "PUT",
      url: `/${newFirstPathComp}`,
      headers: { "content-type": "application/json" },
      body: {
        repository: "git://localhost/repos/single-branch",
        branch: "trunk",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe("");
  });

  test("Return 400 with valid payload but invalid git repository", async () => {
    const repository = "git://localhost/non-existing" as const;
    const branch = "trunk" as const;
    const response = await fastify.inject({
      method: "PUT",
      url: `/${newFirstPathComp}`,
      headers: { "content-type": "application/json" },
      body: {
        repository,
        branch,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toStrictEqual({
      error: `Failed to obtain commit from the branch "${branch}" from the repository "${repository}".`,
      repository,
      branch,
    });
  });
});
