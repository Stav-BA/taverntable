# TavernTable — Deployment Guide

Every great adventure starts at the tavern. Here's how to get yours running.

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- pnpm 9: `npm install -g pnpm@9`
- Docker Desktop (for Postgres + Redis)

### 1. Clone & install
```bash
git clone https://github.com/Stav-BA/taverntable.git
cd taverntable
pnpm install
```

### 2. Start Postgres + Redis
```bash
docker-compose up -d
```

### 3. Set environment variables
```bash
cp .env.example apps/backend/.env
# Edit apps/backend/.env — at minimum set ANTHROPIC_API_KEY
```

### 4. Run database migrations
```bash
pnpm --filter @taverntable/backend prisma migrate dev
```

### 5. Start dev servers (all in one)
```bash
pnpm dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `ANTHROPIC_API_KEY` | ✅ | AI Dungeon Master (get at console.anthropic.com) |
| `SESSION_SECRET` | ✅ | Random string for session signing (`openssl rand -hex 32`) |
| `STRIPE_SECRET_KEY` | ⬜ | Cosmetic premium only — game works without it |
| `STRIPE_WEBHOOK_SECRET` | ⬜ | Required only if Stripe is configured |
| `STRIPE_MONTHLY_PRICE_ID` | ⬜ | Stripe price ID for $4.99/month plan |
| `STRIPE_YEARLY_PRICE_ID` | ⬜ | Stripe price ID for $39.99/year plan |
| `FRONTEND_URL` | ⬜ | Frontend URL for CORS (default: http://localhost:5173) |

---

## Deploy to Render.com (Recommended — Free Tier)

Render gives you free Postgres, Redis, and two web services.

### Steps:
1. Fork or push to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect your GitHub repo
4. Render detects `render.yaml` automatically — click **Apply**
5. Wait for initial deploy (~5 minutes)
6. Set secret env vars in the Render dashboard:
   - `ANTHROPIC_API_KEY` → your Anthropic key
   - `STRIPE_SECRET_KEY` → from Stripe dashboard (optional)
   - `STRIPE_WEBHOOK_SECRET` → from Stripe webhook settings (optional)

### First-time DB setup on Render:
```bash
# In Render shell for backend service:
node apps/backend/dist/prisma-migrate.js
# Or via Render Shell tab: npx prisma migrate deploy
```

---

## Deploy to Railway.app (Alternative)

1. Install Railway CLI: `npm install -g @railway/cli`
2. `railway login`
3. `railway init` → select this repo
4. Add PostgreSQL and Redis plugins in the Railway dashboard
5. Set environment variables in the dashboard
6. `railway up`

---

## Deploy with Docker (Self-Hosted / VPS)

### Build and run:
```bash
# Copy and fill in your env vars
cp .env.example .env.prod
nano .env.prod  # Set all required variables

# Build and start
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Run DB migrations
docker-compose -f docker-compose.prod.yml exec backend \
  npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma
```

### Update to new version:
```bash
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

---

## Stripe Setup (Cosmetic Premium — Optional)

The game is fully playable for free. Premium is cosmetics only.

1. Create account at [stripe.com](https://stripe.com)
2. Create two products in the Stripe dashboard:
   - **TavernTable Premium Monthly** → Price: $4.99/month, recurring
   - **TavernTable Premium Yearly** → Price: $39.99/year, recurring
3. Copy the price IDs (`price_...`) to your env file
4. Set up webhook in Stripe → Webhooks → Add endpoint:
   - URL: `https://your-backend-url/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Running E2E Tests

```bash
# Install Playwright browsers (first time only)
pnpm --filter @taverntable/frontend exec playwright install chromium

# Run all E2E tests
pnpm --filter @taverntable/frontend test:e2e

# Run with UI (interactive)
pnpm --filter @taverntable/frontend test:e2e:ui

# Run on mobile viewports only
pnpm --filter @taverntable/frontend test:e2e --project="Mobile Chrome"
```

---

## Production Checklist

- [ ] `ANTHROPIC_API_KEY` set
- [ ] `SESSION_SECRET` is a random 32+ char string (not the example value)
- [ ] `DATABASE_URL` points to production Postgres
- [ ] DB migrations applied (`prisma migrate deploy`)
- [ ] Redis connection verified (`redis-cli -u $REDIS_URL ping`)
- [ ] CORS `FRONTEND_URL` matches actual frontend domain
- [ ] Stripe webhook endpoint registered and `STRIPE_WEBHOOK_SECRET` set
- [ ] HTTPS configured (Render/Railway handle this automatically)
- [ ] Test a full session: create DM lobby → join as player → roll dice → AI DM narrates

---

## Architecture Overview

```
Internet
    │
    ├── Frontend (React + PixiJS) ──── Nginx (port 80)
    │       ↓ REST + WebSocket
    └── Backend (Node.js) ──────────── Express + Socket.io (port 3001)
            ├── PostgreSQL 16 ─────── Persistent: sessions, characters, campaigns
            ├── Redis 7 ───────────── Real-time: game state (24h TTL), AI DM memory
            ├── Anthropic API ──────── AI DM narration (claude-opus-4-5 / haiku)
            └── Stripe API ─────────── Premium cosmetic subscriptions
```
