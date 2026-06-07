# 🎲 D&D VTT — Full D&D 5e Online Virtual Tabletop

A browser-based, real-time multiplayer D&D 5e (2024 edition) Virtual Tabletop. Players join instantly via a link — no account required.

## Features
- ⚔️ Full D&D 5e 2024 rules engine (character creation, combat, spells, leveling)
- 🗺️ Canvas battle maps with dynamic fog of war & lighting
- 🎲 3D dice roller synced across all players
- 📋 Digital character sheets with auto-calculated stats
- 🧙 DM tools: NPC manager, encounter builder, campaign journal
- 🔊 Ambient audio & sound effects
- 📱 Mobile-friendly
- 🆓 Zero login required for players

## Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | React 18 + PixiJS + Tailwind CSS |
| Backend | Node.js + Socket.io + Express |
| Database | PostgreSQL + Redis |
| Rules Engine | TypeScript shared library |
| Monorepo | pnpm workspaces |

## Quick Start
```bash
pnpm install
pnpm dev
```

Open http://localhost:5173 as DM, share the session code with players.

## Project Structure
```
dnd-vtt/
├── packages/dnd-rules/    # Shared D&D 5e rules engine
├── apps/frontend/         # React + PixiJS VTT
├── apps/backend/          # Node.js + Socket.io server
├── content/srd/           # D&D 5e SRD content (JSON)
└── .claude/agents/        # Claude Code sub-agent team
```

## Sub-Agent Team
| Agent | Responsibility |
|-------|----------------|
| `dnd-orchestrator` | Project coordination & GitHub management |
| `rules-engine` | D&D 5e 2024 mechanics TypeScript library |
| `vtt-frontend` | Canvas map, fog of war, dice roller, UI |
| `backend-realtime` | WebSocket server, sessions, database |
| `character-sheet` | Character builder & digital sheet |
| `content-data` | SRD monsters, spells, items, encounter builder |
| `dm-tools` | NPC manager, campaign journal, DM panel |
| `qa-playtester` | Testing, rule correctness, QA |

## Git Workflow
- `main` — production, protected
- `develop` — integration branch
- `feature/*` — one branch per feature
- `bugfix/*` — bug fixes
- `hotfix/*` — critical production fixes

## Contributing
1. Pick an issue from the GitHub Project board
2. Branch from `develop`: `git checkout -b feature/<name>`
3. Use conventional commits: `feat(scope): description`
4. Open PR to `develop`, fill out the PR template
5. CI must pass + `qa-playtester` review for rules changes

## License
MIT
