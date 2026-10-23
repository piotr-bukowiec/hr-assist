# Base
FROM node:24.19-alpine AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Pinned to match the lockfile / onlyBuiltDependencies in pnpm-workspace.yaml
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

# Mirrors the repo layout (apps/api) so the seed service finds ../../seed/seed.json
WORKDIR /app/apps/api


# Dependencies (all, needed for the build)
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile


# Builder
FROM deps AS builder

COPY . .

RUN pnpm build


# Production dependencies only
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile --prod


# Runner
FROM node:24.19-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app/apps/api

# Seed file is expected at /app/seed/seed.json (mount it as a volume);
# reports are written under the working directory
RUN mkdir -p /app/seed /app/apps/api/reports && chown -R node:node /app

COPY --chown=node:node package.json ./
COPY --chown=node:node --from=prod-deps /app/apps/api/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/apps/api/dist ./dist

USER node

EXPOSE 3001

CMD ["node", "dist/main.js"]
