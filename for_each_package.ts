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

/** Run an NPM command in each package directory. */

import path from "node:path";
import { spawnSync } from "node:child_process";

const packages = ["api-server"] as const;

const packagesDir = path.join(import.meta.dirname, "packages");
const cmd = process.argv.slice(2);
if (cmd.length === 0) {
  throw Error("No command specified.");
}

for (const pkg of packages) {
  const packageDir = path.join(packagesDir, pkg);
  console.log(`Processing "npm ${cmd.join(" ")}" for ${pkg}...`);
  if (
    spawnSync("npm", ["--prefix", packageDir, ...cmd], {
      stdio: "inherit",
    }).status !== 0
  ) {
    throw Error(`Failed to process ${pkg}.`);
  }
}
