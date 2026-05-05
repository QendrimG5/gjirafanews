# syntax=docker/dockerfile:1
# Multi-stage build for the Next.js public site.
# Build context = repo root (so workspace deps resolve through pnpm).

FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

# Copy lockfile + workspace manifest + every package.json so pnpm can plan.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json       apps/web/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json    packages/ui/
COPY packages/utils/package.json packages/utils/

RUN pnpm install --frozen-lockfile

# ── Build ────────────────────────────────────────────────────────────────
FROM deps AS build
COPY packages packages
COPY apps/web apps/web
RUN pnpm --filter @gjirafanews/web build

# ── Runtime ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next.js standalone output bundles only the files needed at runtime.
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static     ./apps/web/.next/static
COPY --from=build /app/apps/web/public           ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
