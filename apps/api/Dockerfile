# API (NestJS). Contexto de build = raíz del monorepo.
FROM node:22

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate

WORKDIR /app

# Manifiestos primero (mejor cache de capas)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

# Código y compilación
COPY . .
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

EXPOSE 3001

# Al arrancar: aplica migraciones, siembra (idempotente) y levanta la API.
CMD ["sh", "-c", "cd apps/api && pnpm exec prisma migrate deploy && pnpm exec ts-node prisma/seed.ts && node dist/main.js"]
