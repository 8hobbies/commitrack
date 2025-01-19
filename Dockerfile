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

FROM node:22.13.0-alpine as base

# Build the app -------------
FROM base as builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install -g npm && npm ci
COPY . .
RUN npm install -g npm && npm run build && rm dist/*.tsbuildinfo

# Production image --------------
FROM base AS runner
WORKDIR /app

LABEL org.opencontainers.image.authors="8 Hobbies, LLC"

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --chown=nodejs:nodejs package.json package-lock.json prisma ./
RUN npm install -g npm && npm ci
COPY --from=builder /app/dist/ ./

USER nodejs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="::"

CMD ["node", "index.js"]
