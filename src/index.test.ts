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

const singleBranchTrunkHash =
  "20af04a56fcdea6d397d42b84f23311ca6fa9b89" as const;

describe("/health", () => {
  test("Return 200", async () => {
    const response = await fastify.inject({
      method: "GET",
      url: "/health",
    });
    expect(response.statusCode).toBe(200);
  });
});

/** Clean up for all tests. */
async function cleanUpTest(): Promise<void> {
  vi.clearAllMocks();
  await prisma.$queryRaw`delete from commits`;
  await prisma.$queryRaw`delete from branches`;
}

describe("/new", () => {
  beforeEach(cleanUpTest);

  const newFirstPathComp = "new" as const;
  for (const [name, payload] of [
    ["empty", {}],
    ["missing repository", { branch: "master" }],
    ["missing branch", { repository: "https://example/my/repo" }],
    [
      "branch name containing *",
      { repository: "https://example/my/repo", branch: "mas*ter" },
    ],
    [
      "branch name containing [",
      { repository: "https://example/my/repo", branch: "ma[ster" },
    ],
    [
      "branch name containing ?",
      { repository: "https://example/my/repo", branch: "m?aster" },
    ],
    [
      "empty branch name",
      { repository: "https://example/my/repo", branch: "" },
    ],
    [
      "overly long branch name",
      { repository: "https://example/my/repo", branch: "a".repeat(10000) },
    ],
    ["empty repository URL", { repository: "", branch: "default" }],
    [
      "overly long repository URL",
      {
        repository: `https://example/my/repo/${"a".repeat(10000)}`,
        branch: "default",
      },
    ],
  ] as const) {
    test(`Return 400 with invalid payload: ${name}`, async () => {
      const response = await fastify.inject({
        method: "POST",
        url: `/${newFirstPathComp}`,
        headers: { "content-type": "application/json" },
        body: payload,
      });

      expect(response.statusCode).toBe(400);
    });
  }

  test("Return 201 with valid payload and valid git repo, branch", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: `/${newFirstPathComp}`,
      headers: { "content-type": "application/json" },
      body: {
        repository: "git://localhost/repos/single-branch",
        branch: "trunk",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toBe("");
  });

  test("Return 403 with valid payload but invalid git repository", async () => {
    const repository = "git://localhost/non-existing" as const;
    const branch = "trunk" as const;
    const response = await fastify.inject({
      method: "POST",
      url: `/${newFirstPathComp}`,
      headers: { "content-type": "application/json" },
      body: {
        repository,
        branch,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body)).toStrictEqual({
      error: {
        message: `Failed to obtain commit from the branch "${branch}" of the repository "${repository}".`,
        type: "commit",
      },
    });
  });

  test("Adding the same repository and branch twice returns 403", async () => {
    const repository = "git://localhost/repos/single-branch" as const;
    const branch = "trunk" as const;

    // Make a new request.
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    async function request() {
      return await fastify.inject({
        method: "POST",
        url: `/${newFirstPathComp}`,
        headers: { "content-type": "application/json" },
        body: {
          repository,
          branch,
        },
      });
    }

    const first_response = await request();
    expect(first_response.statusCode).toBe(201); // First time suceeds.

    const response = await request();
    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body)).toStrictEqual({
      error: {
        message: `Failed to add the "${branch}" of the repository "${repository}". Likely it already exists.`,
        type: "creation",
      },
    });
  });
});

describe("/list-commits", () => {
  beforeEach(cleanUpTest);

  test("Returns 404 if retrieving a repo/branch that has not been tracked", async () => {
    const repository = "git://localhost/repos/single-branch" as const;
    const branch = "trunk" as const;

    const response = await fastify.inject({
      method: "GET",
      query: {
        num_of_commits: "1",
      },
      url: `/list-commits/${encodeURIComponent(repository)}/${branch}`,
    });
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toStrictEqual({
      error: {
        message: `Failed to get commits of the "${branch}" of the repository "${repository}".`,
      },
    });
  });

  test("Can retrieve commits right after adding a new repository/branch", async () => {
    const repository = "git://localhost/repos/single-branch" as const;
    const branch = "trunk" as const;
    const fakeSystemTime = 1737501641134 as const;
    // The app stores rounded down to seconds. It appears to be a round up of
    // fakeSystemTime because the mock timer advances the time by 1 second.
    const expectedRetrievalTime = 1737501642000 as const;
    vi.useFakeTimers({
      now: fakeSystemTime,
      shouldAdvanceTime: true,
      advanceTimeDelta: 1000, // fastify will hang if timer doesn't move at all
    });

    // Add a new repository and branch.
    const newResponse = await fastify.inject({
      method: "POST",
      url: "/new",
      headers: { "content-type": "application/json" },
      body: {
        repository,
        branch,
      },
    });
    expect(newResponse.statusCode).toBe(201); // sanity check

    vi.useRealTimers();

    // List commits.
    const response = await fastify.inject({
      method: "GET",
      query: {
        num_of_commits: "1",
      },
      url: `/list-commits/${encodeURIComponent(repository)}/${branch}`,
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toStrictEqual({
      commits: [
        {
          commit_hash: singleBranchTrunkHash,
          retrieval_time: expectedRetrievalTime,
        },
      ],
      last_commit_retrieval_time: expectedRetrievalTime,
    });
  });

  for (const [name, components] of [
    ["empty", ""],
    ["one component", "/one"],
    ["one component with duplicate leading slash", "//one"],
    ["one component with a trailing slash", "/one/"],
  ] as const) {
    test(`Return 404 with invalid numbers of path components: ${name}`, async () => {
      const response = await fastify.inject({
        method: "GET",
        url: `/list-commits/${components}`,
        query: { num_of_commits: "1" },
      });

      expect(response.statusCode).toBe(404);
    });
  }

  for (const [name, components] of [
    ["containing *", "mas*ter"],
    ["containing [", "mas[ter"],
    ["containing ?", "mas?ter"],
    // Empty branch name is same as one component with a trailing slash test.
  ] as const) {
    test(`Return 400 with an invalid branch name: ${name}`, async () => {
      const response = await fastify.inject({
        method: "GET",
        url: `/list-commits/repo/${encodeURIComponent(components)}`,
        query: { num_of_commits: "1" },
      });

      expect(response.statusCode).toBe(400);
    });
  }
});
