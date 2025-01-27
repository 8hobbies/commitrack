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

/** Utilities. */

import child_process from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(child_process.execFile);

const commit_id_length = 40 as const;
const git_executable_path = process.env.GIT_EXECUTABLE_PATH ?? "/usr/bin/git";
/** git command timeout in milliseconds. */
const git_command_timeout = parseInt(process.env.GIT_COMMAND_TIMEOUT ?? "2000");

/** Get remote git commit hash of a given branch of a given URL. */
export async function getRemoteGitCommit(
  url: string,
  branch: string,
): Promise<string | null> {
  try {
    // TODO: refuse http
    const { stdout } = await execFile(
      git_executable_path,
      // TODO: "--heads" is deprecated, but we are on an older version of git.
      // Use "--branches" once we upgrade to trixie.
      ["ls-remote", "--heads", url, branch],
      {
        timeout: git_command_timeout,
      },
    );
    const hash = stdout.trim().slice(0, commit_id_length);
    /* v8 ignore start */
    // TODO: Better check
    if (hash.length != commit_id_length) {
      // git printed an unexpected value
      return null;
    }
    /* v8 ignore end */

    return hash;
  } catch (error: unknown) {
    console.log({ error });
    // git failed
    return null;
  }
}
