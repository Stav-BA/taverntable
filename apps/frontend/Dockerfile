# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN npm install -g pnpm@9
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/dnd-rules/package.json ./packages/dnd-rules/
COPY apps/frontend/package.json ./apps/frontend/
COPY content/package.json ./content/
RUN pnpm install --frozen-lockfile

COPY packages/dnd-rules ./packages/dnd-rules
COPY apps/frontend ./apps/frontend
COPY content ./content

RUN pnpm --filter @taverntable/dnd-rules build
RUN pnpm --filter @taverntable/frontend build

# ─── Stage 2: Serve with nginx ───────────────────────────────────────────────
FROM nginx:1.25-alpine AS runner
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Non-root nginx
RUN chown -R nginx:nginx /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
