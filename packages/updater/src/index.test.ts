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
import { updateCommits } from "./index.ts";

const apiServerUrl = "http://api-server:3000" as const;
const prisma = new PrismaClient();

const singleBranchRepository = "git://test-repos/repos/single-branch" as const;
const singleBranchRepoBranch = "trunk" as const;

/** Clean up for all tests. */
async function cleanUpTest(): Promise<void> {
  vi.clearAllMocks();
  await prisma.$queryRaw`delete from commits`;
  await prisma.$queryRaw`delete from branches`;
}

/** Add the single branch repo to the database. */
async function addSingleBranchRepo(): Promise<void> {
  const response = await fetch(`${apiServerUrl}/new`, {
    method: "POST",
    headers: new Headers({ "content-type": "application/json" }),
    body: JSON.stringify({
      repository: singleBranchRepository,
      branch: singleBranchRepoBranch,
    }),
  });

  if (response.status !== 201) {
    throw new Error("Failed to add the single branch repository.");
  }
}

/** Update the single branch repo last commit retrieval time */
async function updateSingleBranchRepoLastCommitRetrievalTime(
  t: Date,
): Promise<void> {
  await prisma.branches.update({
    where: {
      repository_branch: {
        repository: singleBranchRepository,
        branch: singleBranchRepoBranch,
      },
    },
    data: {
      last_commit_retrieval_time: t,
    },
  });
}

async function listSingleBranchRepoCommits(): Promise<object> {
  const response = await fetch(
    `${apiServerUrl}/list-commits/${encodeURIComponent(singleBranchRepository)}/${singleBranchRepoBranch}?num_of_commits=1`,
    {
      method: "GET",
    },
  );

  const jsonResponse = await response.json();
  if (response.status !== 200 || !jsonResponse) {
    throw new Error("Failed to list commits.");
  }

  return jsonResponse;
}

describe("Test updating commit", () => {
  beforeEach(cleanUpTest);

  test("Do nothing when all retrieval times were less than 24 hours", async () => {
    await addSingleBranchRepo();
    const commitsBeforeUpdate = await listSingleBranchRepoCommits();
    await updateCommits(1);
    const commitsAfterUpdate = await listSingleBranchRepoCommits();
    expect(commitsBeforeUpdate).toStrictEqual(commitsAfterUpdate);
  });

  test("Only update last commit retrival time when there's no new commit but retriveval time is more than 24 hours", async () => {
    await addSingleBranchRepo();
    const commitsBeforeUpdate = await listSingleBranchRepoCommits();
    // sanity check
    if (!("commits" in commitsBeforeUpdate)) {
      throw new Error("Expected commits in the response.");
    }

    // Make the last commit retrieval time to be more than 24 hours ago.
    const now = new Date().getTime();
    const yesterday = new Date();
    const dayOffset = 24 * 60 * 60 * 1000 + 1;
    yesterday.setTime(yesterday.getTime() - dayOffset);
    await updateSingleBranchRepoLastCommitRetrievalTime(yesterday);

    await updateCommits(1);

    let commitsAfterUpdate: object = {};
    // Wait until the last commit retrieval time is updated.
    await vi.waitFor(
      async () => {
        commitsAfterUpdate = await listSingleBranchRepoCommits();
        if (!("last_commit_retrieval_time" in commitsAfterUpdate)) {
          throw new Error(
            "Expected last_commit_retrieval_time in the response.",
          );
        }

        if (
          commitsAfterUpdate.last_commit_retrieval_time === yesterday.getTime()
        ) {
          throw new Error("last_commit_retrieval_time is not yet updated.");
        }
      },
      {
        timeout: 5000,
      },
    );

    expect(commitsAfterUpdate).toHaveProperty("last_commit_retrieval_time");
    if (!("last_commit_retrieval_time" in commitsAfterUpdate)) {
      throw new Error("Expected last_commit_retrieval_time in the response.");
    }
    expect(
      commitsAfterUpdate.last_commit_retrieval_time,
    ).toBeGreaterThanOrEqual(now);
    expect(commitsAfterUpdate).toHaveProperty(
      "commits",
      commitsBeforeUpdate.commits,
    );
  }, 10000);
});
