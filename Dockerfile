# syntax=docker/dockerfile:1.7
#
# Mirrors the portfolio's image so both run the same way on the host.
# NEXT_BASE_PATH is a build argument, not a runtime variable: Next bakes the
# base path into the emitted asset URLs, so it has to be set before the build.

# A glibc base, not Alpine: the lockfile resolves @next/swc-linux-x64-gnu, and
# npm ci installs exactly what the lockfile pins — on musl that leaves Next
# with no usable SWC binary and the build dies loading it.
FROM node:22.11-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22.11-bookworm-slim AS builder
WORKDIR /app
ARG NEXT_BASE_PATH=""
ENV NEXT_BASE_PATH=$NEXT_BASE_PATH \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22.11-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001 \
    HOSTNAME=0.0.0.0

RUN groupadd -g 1001 nextjs && useradd -u 1001 -g nextjs -m nextjs

COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3001
CMD ["node", "server.js"]
