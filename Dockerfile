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

FROM docker.io/node:22.13.0-alpine@sha256:f2dc6eea95f787e25f173ba9904c9d0647ab2506178c7b5b7c5a3d02bc4af145 as base

# Build the app -------------
FROM base as builder

WORKDIR /app

COPY . .
RUN npm install -g npm && npm ci && npm run build && rm dist/*.tsbuildinfo

# Production image --------------
FROM base AS runner
WORKDIR /app

LABEL org.opencontainers.image.authors="8 Hobbies, LLC"
LABEL org.opencontainers.image.licenses=AGPL-3.0-or-later

# Remove the community repository. This is to ensure that we only rely on
# packages with future availability.
RUN sed -i /community/d /etc/apk/repositories && cat /etc/apk/repositories

RUN apk add --no-cache git

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
