# syntax=docker/dockerfile:1
# Multi-stage build for the Vite + React admin SPA.
# Build context = repo root (so workspace deps resolve through pnpm).

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/admin/package.json     apps/admin/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json    packages/ui/
COPY packages/utils/package.json packages/utils/

RUN pnpm install --frozen-lockfile

COPY packages   packages
COPY apps/admin apps/admin
RUN pnpm --filter @gjirafanews/admin build

# ── Runtime: nginx serves the static bundle ──────────────────────────────
FROM nginx:alpine
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
