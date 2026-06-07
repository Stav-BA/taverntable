# ─── Stage 1: Install deps ───────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/dnd-rules/package.json ./packages/dnd-rules/
COPY apps/backend/package.json ./apps/backend/
COPY content/package.json ./content/
RUN pnpm install --frozen-lockfile --prod

# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM base AS builder
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/dnd-rules/package.json ./packages/dnd-rules/
COPY apps/backend/package.json ./apps/backend/
COPY content/package.json ./content/
RUN pnpm install --frozen-lockfile

COPY packages/dnd-rules ./packages/dnd-rules
COPY apps/backend ./apps/backend
COPY content ./content

RUN pnpm --filter @taverntable/dnd-rules build
RUN pnpm --filter @taverntable/backend build

# ─── Stage 3: Runtime ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init
RUN npm install -g pnpm@9
WORKDIR /app

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend
USER backend

COPY --from=deps --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=backend:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=backend:nodejs /app/packages/dnd-rules/dist ./packages/dnd-rules/dist
COPY --from=builder --chown=backend:nodejs /app/content ./content
COPY --from=builder --chown=backend:nodejs /app/apps/backend/prisma ./apps/backend/prisma

EXPOSE 3001
ENV NODE_ENV=production

# dumb-init handles signal forwarding for graceful shutdown
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/backend/dist/index.js"]
