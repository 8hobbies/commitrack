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

const instanceAddress = "http://localhost:3000" as const;
const prisma = new PrismaClient();

/** Clear all tables. */
async function clearAllTables(): Promise<void> {
  await prisma.$queryRaw`delete from commits`;
  await prisma.$queryRaw`delete from branches`;
}

describe("Brief test directly for a running Docker container", () => {
  const newFirstPathComp = "new" as const;

  describe("/health", () => {
    test("Return 200", async () => {
      const response = await fetch(`${instanceAddress}/health`, {
        method: "GET",
      });

      expect(response.status).toBe(200);
    });
  });
  describe("/new", () => {
    beforeEach(clearAllTables);

    test("Return 400 with invalid payload", async () => {
      const response = await fetch(`${instanceAddress}/${newFirstPathComp}`, {
        method: "POST",
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify({ branch: "master" }),
      });

      expect(response.status).toBe(400);
    });

    test("Return 201 with valid payload and valid git repo, branch", async () => {
      const response = await fetch(`${instanceAddress}/${newFirstPathComp}`, {
        method: "POST",
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify({
          repository: "git://test-repos/repos/single-branch",
          branch: "trunk",
        }),
      });

      expect(response.status).toBe(201);
      expect(await response.text()).toBe("");
    });

    test("Return 403 with valid payload but invalid git repository", async () => {
      const repository = "git://localhost/non-existing" as const;
      const branch = "trunk" as const;
      const response = await fetch(`${instanceAddress}/${newFirstPathComp}`, {
        method: "POST",
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify({
          repository,
          branch,
        }),
      });

      expect(response.status).toBe(403);
      expect(await response.json()).toStrictEqual({
        error: {
          message: `Failed to obtain commit from the branch "${branch}" of the repository "${repository}".`,
          type: "commit",
        },
      });
    });
  });

  describe("/list-commits", () => {
    beforeEach(clearAllTables);

    test("Can retrieve commits and last retrieval time right after adding a new repository/branch", async () => {
      const repository = "git://test-repos/repos/single-branch" as const;
      const branch = "trunk" as const;

      // Add a new repository and branch.
      const newResponse = await fetch(
        `${instanceAddress}/${newFirstPathComp}`,
        {
          method: "POST",
          headers: new Headers({ "content-type": "application/json" }),
          body: JSON.stringify({
            repository,
            branch,
          }),
        },
      );
      expect(newResponse.status).toBe(201); // sanity check

      // List commits.
      const response = await fetch(
        `${instanceAddress}/list-commits/${encodeURIComponent(repository)}/${branch}?num_of_commits=1`,
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        commits: [
          {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            commit_hash: expect.any(String),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            retrieval_time: expect.any(Number),
          },
        ],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        last_commit_retrieval_time: expect.any(Number),
      });
    });

    test("Return 400 with invalid path components", async () => {
      const response = await fetch(
        `${instanceAddress}/list-commits/repo/mas*ter?num_of_commits=1`,
      );

      expect(response.status).toBe(400);
    });
  });
});
