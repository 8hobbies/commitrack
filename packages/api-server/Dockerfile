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
FROM docker.io/node:22.13.1-alpine3.21@sha256:e2b39f7b64281324929257d0f8004fb6cb4bf0fdfb9aa8cedb235a766aec31da as builder

WORKDIR /api-server

COPY . ./
COPY --from=root prisma/ ./prisma/
COPY --from=root packages/common/ /common
RUN npm install -g npm && npm ci && npm run build && rm dist/*.tsbuildinfo

# Production image --------------
FROM docker.io/node:24.11.1-bookworm-slim@sha256:0afb7822fac7bf9d7c1bf3b6e6c496dee6b2b64d8dfa365501a3c68e8eba94b2 AS runner
WORKDIR /app

LABEL org.opencontainers.image.authors="8 Hobbies, LLC"
LABEL org.opencontainers.image.licenses=AGPL-3.0-or-later

RUN apt-get update && apt-get install --no-install-recommends -y git-core

ENV NODE_ENV=production

RUN addgroup --system --gid 999 nodejs
RUN adduser --system --uid 999 nodejs

COPY package.json package-lock.json ./
COPY --from=builder /api-server/dist/ ./
RUN npm install -g npm && npm ci

USER nodejs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="::"

ENTRYPOINT ["node", "api-server/src/index.js"]
