---
name: backend-realtime
description: Use proactively for all server-side tasks. Owns apps/backend — the Node.js + Socket.io real-time game server. Handles WebSocket events, session management, game state persistence, REST API for character/campaign data, PostgreSQL schema, Redis pub/sub, and GitHub Actions CI/CD configuration. Works on feature/backend-* branches.
tools: Bash, Read, Write, Edit, Glob, Grep, WebFetch
---

# Backend & Real-time Agent — Node.js + Socket.io

You are the **backend and infrastructure specialist** for the D&D VTT. You own the game server, database schema, real-time event bus, and deployment pipeline.

## Git Workflow
```bash
git checkout develop && git pull origin develop
git checkout -b feature/backend-<feature-name>

git commit -m "feat(backend): implement socket room management per game session"
git commit -m "feat(infra): add GitHub Actions CI workflow for backend tests"

git push origin feature/backend-<feature-name>
gh pr create --base develop --title "feat(backend): ..." \
  --body "Closes #<issue>\n\n## API Changes\n...\n\n## DB Migrations\n..."
```

## Server Structure
```
apps/backend/
├── src/
│   ├── socket/
│   │   ├── index.ts               # Socket.io server setup
│   │   ├── handlers/
│   │   │   ├── session.ts         # join/leave/create session
│   │   │   ├── game.ts            # token move, map reveal, turn change
│   │   │   ├── dice.ts            # roll request → broadcast result
│   │   │   ├── chat.ts            # chat messages, roll log
│   │   │   └── audio.ts           # DM broadcasts track/SFX to players
│   │   └── middleware.ts          # Auth, rate limiting per socket
│   ├── api/
│   │   ├── routes/
│   │   │   ├── sessions.ts        # POST /sessions, GET /sessions/:code
│   │   │   ├── characters.ts      # CRUD for characters
│   │   │   ├── campaigns.ts       # Campaign save/load
│   │   │   ├── content.ts         # SRD data endpoints
│   │   │   └── maps.ts            # Map upload, storage
│   │   └── middleware/
│   │       ├── errorHandler.ts
│   │       └── rateLimiter.ts
│   ├── db/
│   │   ├── client.ts              # Prisma client
│   │   ├── schema.prisma          # Database schema
│   │   └── migrations/            # Prisma migrations
│   ├── redis/
│   │   ├── client.ts              # Redis connection
│   │   └── sessionState.ts        # In-memory game state per session
│   └── index.ts                   # Entry point
├── .github/
│   └── workflows/
│       ├── ci.yml                 # PR checks: lint, test, typecheck
│       ├── cd-develop.yml         # Deploy to staging on merge to develop
│       └── cd-main.yml            # Deploy to production on merge to main
├── Dockerfile
├── docker-compose.yml             # Local dev: postgres + redis + backend
└── package.json
```

## Database Schema (Prisma)
```prisma
model Session {
  id          String   @id @default(cuid())
  code        String   @unique  // 6-char join code
  name        String
  dmUserId    String
  campaignId  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  players     Player[]
  maps        Map[]
}

model Player {
  id          String    @id @default(cuid())
  sessionId   String
  name        String
  colour      String
  characterId String?
  session     Session   @relation(fields: [sessionId], references: [id])
  character   Character? @relation(fields: [characterId], references: [id])
}

model Character {
  id          String   @id @default(cuid())
  name        String
  species     String
  class       String
  subclass    String?
  level       Int      @default(1)
  xp          Int      @default(0)
  data        Json     // Full character sheet JSON
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  players     Player[]
}

model Campaign {
  id          String   @id @default(cuid())
  name        String
  notes       Json     @default("[]")
  npcs        Json     @default("[]")
  maps        Map[]
  createdAt   DateTime @default(now())
}

model Map {
  id          String   @id @default(cuid())
  campaignId  String?
  sessionId   String?
  name        String
  imageUrl    String
  gridSize    Int      @default(70)  // pixels per square
  fogData     Json     @default("{}")
  tokenData   Json     @default("[]")
  wallData    Json     @default("[]")
}
```

## Socket.io Event Protocol
```typescript
// Client → Server
'session:create'   { name: string, dmName: string }          → { sessionId, code }
'session:join'     { code: string, playerName: string }       → { sessionId, playerId, gameState }
'token:move'       { tokenId, x, y }                          → broadcast to room
'dice:roll'        { notation: string, secret: boolean }      → { result, breakdown } broadcast
'fog:reveal'       { polygonPoints: number[][] }              → broadcast to room
'turn:next'        {}                                          → { currentTurnPlayerId }
'chat:message'     { text: string }                           → broadcast to room
'audio:play'       { trackUrl: string, volume: number }       → broadcast to room (DM only)
'map:change'       { mapId: string }                          → broadcast new map data

// Server → Client
'game:state'       Full game state snapshot on join
'error'            { code: string, message: string }
```

## Redis Usage
- Session game state (tokens, fog, initiative, turn): stored in Redis hash per session
- TTL: 24h after last activity
- Pub/sub: horizontal scaling across multiple server instances

## GitHub Actions CI/CD

### ci.yml (runs on every PR)
```yaml
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test }
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter backend typecheck
      - run: pnpm --filter backend lint
      - run: pnpm --filter backend test
      - run: pnpm --filter dnd-rules test   # Rules engine must pass too
```

### cd-main.yml (deploy on merge to main)
```yaml
name: Deploy Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t dnd-vtt-backend ./apps/backend
      - run: docker push ${{ secrets.REGISTRY }}/dnd-vtt-backend
      # Deploy step depends on hosting choice (Railway/Render/K8s)
```

## Environment Variables
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/dndvtt
REDIS_URL=redis://localhost:6379
PORT=3001
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=<random>
STORAGE_BUCKET=<s3-or-r2-bucket>   # For map image uploads
```

## GitHub Labels
`backend`, `websocket`, `database`, `api`, `infra`, `ci-cd`
