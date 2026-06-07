# 🍺 TavernTable

> *Every great adventure starts at the tavern.*

**TavernTable** is a fully illustrated, cross-platform D&D 5e 2024 Online Virtual Tabletop. Play with friends or solo with an AI Dungeon Master. No limits on gameplay — ever.

[![CI](https://github.com/Stav-BA/taverntable/actions/workflows/ci.yml/badge.svg)](https://github.com/Stav-BA/taverntable/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ What is TavernTable?

A browser-based, real-time multiplayer D&D 5e experience where:
- 🧙 **Character creation is the star** — Guided wizard, Quick-Start, or Expert mode
- 🤖 **AI Dungeon Master** runs the game solo or alongside a human DM
- 🗺️ **Living world** — NPCs remember you, your choices shape the world
- 🎲 **Full D&D 5e 2024 rules** — every mechanic, every spell, every class
- 🆓 **Free forever** for full gameplay — premium is cosmetics only

---

## 🎮 Features

| Feature | Detail |
|---------|--------|
| 🧙 Character Creation | Guided wizard / Quick-Start / Expert — illustrated, step-by-step |
| 🤖 AI Dungeon Master | Adaptive tone, full campaign memory, hybrid with human DMs |
| 🗺️ Battle Maps | Canvas grid with dynamic fog of war + dynamic lighting |
| 🎲 3D Dice Roller | Physics-based, synced across all players in real-time |
| 📋 Digital Character Sheets | Auto-calculated stats, HP, spell slots, conditions |
| 🧑‍🤝‍🧑 Multiplayer | Share link / room code / friend invite — recommended 4, soft cap 8 |
| 🎭 Theater of the Mind | No map needed — pure narrative combat mode |
| 🌍 Living World | World state, economy, NPC memory persist across sessions |
| 🎙️ Voice + Text Chat | Built-in PTT voice chat + full text log |
| 🎨 AI Portraits | Describe your character → hand-drawn illustrated portrait |
| 🌐 Bilingual | English 🇺🇸 + Hebrew 🇮🇱 at launch |
| 💎 Freemium | Full game free — premium = portrait packs, dice skins, table themes |

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/Stav-BA/taverntable.git
cd taverntable

# Install (requires pnpm)
pnpm install

# Run everything
pnpm dev
```

Open **http://localhost:5173** as DM → share the session link with your players.

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + PixiJS + Tailwind CSS |
| Backend | Node.js + Socket.io + Express |
| Database | PostgreSQL + Redis |
| Rules Engine | TypeScript — `@taverntable/dnd-rules` |
| AI DM | Claude API (Anthropic) |
| AI Portraits | Stability AI |
| Auth | Auth.js (accounts) + anonymous sessions |
| Payments | Stripe |
| Monorepo | pnpm workspaces |

---

## 📁 Project Structure

```
taverntable/
├── packages/
│   └── dnd-rules/          # @taverntable/dnd-rules — shared rules engine
├── apps/
│   ├── frontend/           # React + PixiJS VTT
│   └── backend/            # Node.js + Socket.io server
├── content/
│   └── srd/                # D&D 5e SRD JSON data
├── .claude/
│   └── agents/             # 8 Claude Code sub-agents
└── .github/
    └── workflows/          # CI/CD pipelines
```

---

## 🤖 Sub-Agent Team

| Agent | Responsibility |
|-------|----------------|
| `dnd-orchestrator` | Project coordination, GitHub management, sprint routing |
| `rules-engine` | D&D 5e 2024 mechanics — the TypeScript rules library |
| `vtt-frontend` | Canvas map, fog of war, 3D dice, audio, UI |
| `backend-realtime` | WebSocket server, sessions, PostgreSQL, Redis |
| `character-sheet` | Character creation wizard + live digital sheet |
| `content-data` | SRD monsters, spells, items, encounter builder |
| `dm-tools` | NPC manager, campaign journal, scene manager |
| `qa-playtester` | Rule correctness, E2E testing, PR reviews |

---

## 🌿 Git Workflow

```
main         ← protected, production-ready
develop      ← integration branch
feature/*    ← one branch per feature
bugfix/*     ← bug fixes from develop
hotfix/*     ← critical fixes from main
release/*    ← release candidates
```

**Commit format:** `feat(rules): implement weapon mastery Graze property`

---

## 🗓️ Sprint Roadmap

| Sprint | Focus | Status |
|--------|-------|--------|
| 1 | Rules Engine + Backend foundation | 🟢 **Active** |
| 2 | Character Creation (all 3 modes) | ⏳ Planned |
| 3 | VTT Canvas Map + Dice Roller | ⏳ Planned |
| 4 | AI Dungeon Master | ⏳ Planned |
| 5 | DM Tools + Content Library | ⏳ Planned |
| 6 | Polish + Freemium + Launch | ⏳ Planned |

---

## 💰 Freemium Model

| Tier | Gameplay | Cosmetics |
|------|----------|-----------|
| 🆓 Free | Everything — zero limits | Default dice, portraits, table |
| 💎 Premium | Same as free | Portrait packs, dice skins, table themes, exclusive art |

---

## 📜 License

MIT — build with us, fork it, contribute back.

---

*"Roll for initiative."* 🎲
