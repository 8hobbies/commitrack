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

import { rmSync, symlinkSync } from "node:fs";

/** Test utilities. */

/** The first commit in the trunk branch in the single-branch repository. */
export const singleBranchTrunkFirstCommitHash =
  "20af04a56fcdea6d397d42b84f23311ca6fa9b89" as const;
/** The second commit in the trunk branch in the single-branch repository. */
export const singleBranchTrunkSecondCommitHash =
  "861b47c02658592b5f839113589e4173c9e9100d" as const;

const repoDir = "/srv/repos" as const;
const singleBranchRepoPath = `${repoDir}/single-branch` as const;

/** Lets the test single-branch repo have two commits. */
export function useTwoCommitsSingleBranch(): void {
  rmSync(singleBranchRepoPath);
  symlinkSync(`${singleBranchRepoPath}.two-commits`, singleBranchRepoPath);
}

/** Lets the test single-branch repo have one commits. */
export function useOneCommitSingleBranch(): void {
  rmSync(singleBranchRepoPath);
  symlinkSync(`${singleBranchRepoPath}.one-commit`, singleBranchRepoPath);
}

/** Restores the test repos to their original states. */
export function restoreAllTestRepos(): void {
  useOneCommitSingleBranch();
}
