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


# Build the app -------------
FROM docker.io/node:22.13.1-alpine3.21@sha256:9861e45b6bcfee6115070bacd7daa1f10179bd95675b683fdba0de8aaa8f4269 as builder

WORKDIR /app

COPY . .
RUN npm install -g npm && npm ci && npm run build && rm dist/*.tsbuildinfo

# Production image --------------
FROM docker.io/node:22.13.1-bookworm-slim@sha256:34d121c93aad04b4b93152216d419d5b3b14c12fedd87aaa8f1d64c827edd817 AS runner
WORKDIR /app

LABEL org.opencontainers.image.authors="8 Hobbies, LLC"
LABEL org.opencontainers.image.licenses=AGPL-3.0-or-later

RUN apt-get update && apt-get install --no-install-recommends -y git-core && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY package.json package-lock.json ./
COPY --from=builder /app/dist/ ./
RUN npm install -g npm && npm ci

USER nodejs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="::"

ENTRYPOINT ["node", "index.js"]
