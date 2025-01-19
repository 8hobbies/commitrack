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

# Initialize database for test purposes

set -x

DOCKER_CMD=${DOCKER_CMD:-podman}
export DATABASE_CONNECTION_STRING=postgresql://commitrack:commitrack@localhost:5432/commitrack

timeout 10s bash -c "until ${DOCKER_CMD} exec commitrack_db pg_isready -U commitrack -d commitrack; do sleep 1; done" || { echo "Failed to wait for the database to up" ; exit 1; }

npx prisma migrate dev || { echo "Failed to migrate" ; exit 1; }
