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

/** This pattern filters out a subset of illegal branch names. It's not perfect,
but it should eliminate all uses of patterns that may match multiple branch
names. */
export const branchNamePattern = "^[^*?[]+$" as const;

/** Imposed limit of string length in various payloads. */
export const repoUrlMaxLength = 1000 as const;
export const branchMaxLength = 100 as const;
