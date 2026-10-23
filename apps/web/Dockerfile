# Base
FROM node:24.19-alpine AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Pinned to match the lockfile / onlyBuiltDependencies in pnpm-workspace.yaml
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

WORKDIR /app


# Dependencies
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Hoisted (flat) node_modules — the standalone output can't trace pnpm's symlinked layout
RUN pnpm install --frozen-lockfile --config.node-linker=hoisted


# Builder
FROM deps AS builder

ENV NEXT_TELEMETRY_DISABLED=1

# Optional override from docker-compose; process.env takes precedence over .env in Next.js
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY . .

# NEXT_PUBLIC_* values are read from .env and inlined into the bundle at build time
RUN test -f .env || (echo "apps/web/.env is missing — copy it from .env.example first" && exit 1)

RUN pnpm build


# Runner
FROM node:24.19-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# output: "standalone" bundles only the files needed to run the server
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static

USER node

EXPOSE 3000

CMD ["node", "server.js"]
