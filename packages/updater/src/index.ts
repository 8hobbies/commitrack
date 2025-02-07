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

/** Script that updates commit data. */

import { PrismaClient } from "@prisma/client";
import { getRemoteGitCommit } from "../../common/src/common.js";

/* v8 ignore start */
if (process.env.DATABASE_CONNECTION_URL === undefined) {
  throw new Error("DATABASE_CONNECTION_URL is required");
}
/* v8 ignore end */

/** Update commits for branches that haven't been updated for 24 hours.
 *
 * @param maxNumOfProcessingRepositories - Max number of repositories to update
 * each time when this script is run.
 */
export async function updateCommits(
  maxNumOfProcessingRepositories: number,
): Promise<void> {
  const prisma = new PrismaClient();
  await prisma.$connect();

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  try {
    const branches = await prisma.branches.findMany({
      where: {
        last_commit_retrieval_time: {
          // Retrieve commits that were last updated more than 24 hours ago.
          lt: oneDayAgo,
        },
      },
      orderBy: {
        last_commit_retrieval_time: "asc",
      },
      take: maxNumOfProcessingRepositories,
    });

    for (const branch of branches) {
      const commit = await getRemoteGitCommit(branch.repository, branch.branch);
      const now = new Date();

      // Update last_commit_retrieval_time for the branch regardless of success
      // or not.
      await prisma.branches.update({
        where: {
          id: branch.id,
        },
        data: {
          last_commit_retrieval_time: now,
        },
      });

      if (commit === null) {
        console.log(
          `Failed to retrieve commit for repository ${branch.repository} and branch ${branch.branch}`,
        );
        continue;
      }

      const lastCommit = await prisma.commits.findFirst({
        where: {
          branch_id: branch.id,
        },
        orderBy: {
          retrieval_time: "desc",
        },
      });

      if (lastCommit?.commit_hash === commit) {
        // Same commit hash as before, No need to add anything.
        console.log(
          `Commit for repository ${branch.repository} and branch ${branch.branch} remains the same`,
        );
        continue;
      }

      await prisma.commits.create({
        data: {
          branch_id: branch.id,
          commit_hash: commit,
          retrieval_time: now,
        },
      });
    }
  } catch (error: unknown) {
    console.log({ error });
  } finally {
    await prisma.$disconnect();
  }
}
