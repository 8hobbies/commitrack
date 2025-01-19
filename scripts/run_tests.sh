#!/bin/bash

# @license AGPL-3.0-or-later
#
# Copyright(C) 2025 8 Hobbies, LLC
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

set -x

DOCKER_CMD=${DOCKER_CMD:-podman}

${DOCKER_CMD} compose up -d db --detach || { echo "Failed to spin up the database container" ; exit 1; }
./scripts/init_test_db.sh || { echo "Failed to initialize db" ; exit 1 ; }
DATABASE_CONNECTION_STRING=postgresql://commitrack:commitrack@localhost:5432/commitrack npx vitest --run index.test.ts --coverage
result=$?
${DOCKER_CMD} compose down
exit $result
