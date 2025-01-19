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

import Fastify from "fastify";
import routeHealth from "./route_health.js";
import routeNew from "./route_new.js";

/* v8 ignore start */
if (process.env.DATABASE_CONNECTION_STRING === undefined) {
  throw new Error("DATABASE_CONNECTION_STRING is required");
}
/* v8 ignore end */

const fastify = Fastify({
  logger: true,
  ignoreDuplicateSlashes: true,
  ignoreTrailingSlash: true,
});

fastify.register(routeHealth);
fastify.register(routeNew);

// Run the server!
const start = async (): Promise<void> => {
  try {
    await fastify.listen({
      port: parseInt(process.env.PORT ?? "3000"),
      host: process.env.HOSTNAME ?? "localhost",
    });
    /* v8 ignore start */
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
    /* v8 ignore end */
  }
};
await start();

export default fastify;
