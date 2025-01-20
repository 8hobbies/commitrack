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

describe("Brief test directly for a running Docker container", () => {
  describe("/health", () => {
    test("Return 204", async () => {
      const response = await fetch(`${instanceAddress}/health`, {
        method: "GET",
      });

      expect(response.status).toBe(204);
    });
  });
  describe("/new", () => {
    beforeEach(async () => {
      await prisma.$queryRaw`delete from branches`;
    });

    const newFirstPathComp = "new" as const;
    test("Return 400 with invalid payload", async () => {
      const response = await fetch(`${instanceAddress}/${newFirstPathComp}`, {
        method: "POST",
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify({ branch: "master" }),
      });

      expect(response.status).toBe(400);
    });

    test("Return 204 with valid payload and valid git repo, branch", async () => {
      const response = await fetch(`${instanceAddress}/${newFirstPathComp}`, {
        method: "POST",
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify({
          repository: "git://test-repos/repos/single-branch",
          branch: "trunk",
        }),
      });

      expect(response.status).toBe(204);
      expect(await response.text()).toBe("");
    });

    test("Return 400 with valid payload but invalid git repository", async () => {
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

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({
        error: `Failed to obtain commit from the branch "${branch}" of the repository "${repository}".`,
        repository,
        branch,
      });
    });
  });
});
