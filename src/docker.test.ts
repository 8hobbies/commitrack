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

const instanceAddress = "http://localhost:3000" as const;

describe("Brief test directly for a running Docker container", () => {
  describe("/new", () => {
    const newFirstPathComp = "new" as const;
    test("Return 400 with invalid payload", async () => {
      const response = await fetch(`${instanceAddress}/${newFirstPathComp}`, {
        method: "PUT",
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify({ branch: "master" }),
      });

      expect(response.status).toBe(400);
    });

    test("Return 204 with valid payload", async () => {
      const response = await fetch(`${instanceAddress}/${newFirstPathComp}`, {
        method: "PUT",
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify({
          repository: "https://example.com/git/repo",
          branch: "master",
        }),
      });

      expect(response.status).toBe(204);
      expect(response.body).toBe(null);
    });
  });
});
