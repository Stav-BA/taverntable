import express from 'express';
import Fuse from 'fuse.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

type SRDRecord = Record<string, unknown>;

function loadJson(rel: string): SRDRecord[] {
  try {
    return JSON.parse(readFileSync(resolve(__dirname, rel), 'utf-8')) as SRDRecord[];
  } catch {
    return [];
  }
}

// Load SRD data at startup (empty until populated)
const monsters = loadJson('../../../../content/srd/monsters/index.json');
const spells   = loadJson('../../../../content/srd/spells/index.json');
const weapons  = loadJson('../../../../content/srd/items/weapons.json');
const armor    = loadJson('../../../../content/srd/items/armor.json');
const magicItems = loadJson('../../../../content/srd/items/magic-items.json');

const router = express.Router();

// ─── Fuse.js search indices ────────────────────────────────────────────────
const monsterFuse = new Fuse(monsters, {
  keys: ['name', 'type', 'alignment'],
  threshold: 0.35,
  includeScore: true,
});

const spellFuse = new Fuse(spells, {
  keys: ['name', 'school', 'description', 'classes'],
  threshold: 0.35,
  includeScore: true,
});

const allItems = [...weapons, ...armor, ...magicItems];
const itemFuse = new Fuse(allItems, {
  keys: ['name', 'type', 'rarity'],
  threshold: 0.35,
  includeScore: true,
});

// ─── XP tables ─────────────────────────────────────────────────────────────
const XP_THRESHOLDS: Record<number, { easy: number; medium: number; hard: number; deadly: number }> = {
  1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

function getMultiplier(monsterCount: number): number {
  if (monsterCount === 1) return 1;
  if (monsterCount === 2) return 1.5;
  if (monsterCount <= 6) return 2;
  if (monsterCount <= 10) return 2.5;
  if (monsterCount <= 14) return 3;
  return 4;
}

function paginate<T>(items: T[], page: number, limit: number): { data: T[]; total: number; page: number; limit: number } {
  const start = (page - 1) * limit;
  return { data: items.slice(start, start + limit), total: items.length, page, limit };
}

// ─── GET /api/content/monsters ─────────────────────────────────────────────
router.get('/monsters', (req, res) => {
  const { search, cr, type, page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  let results: SRDRecord[] = monsters;

  if (search) {
    results = monsterFuse.search(search).map((r) => r.item);
  }

  if (cr !== undefined) {
    const crNum = parseFloat(cr);
    results = results.filter((m) => m['cr'] === crNum);
  }

  if (type) {
    const typeLower = type.toLowerCase();
    results = results.filter((m) => String(m['type'] ?? '').toLowerCase().includes(typeLower));
  }

  res.json(paginate(results, pageNum, limitNum));
});

// ─── GET /api/content/spells ───────────────────────────────────────────────
router.get('/spells', (req, res) => {
  const { search, level, class: cls, school, page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  let results: SRDRecord[] = spells;

  if (search) {
    results = spellFuse.search(search).map((r) => r.item);
  }

  if (level !== undefined) {
    const lvlNum = parseInt(level);
    results = results.filter((s) => s['level'] === lvlNum);
  }

  if (cls) {
    const clsLower = cls.toLowerCase();
    results = results.filter((s) => Array.isArray(s['classes']) && (s['classes'] as string[]).includes(clsLower));
  }

  if (school) {
    const schoolLower = school.toLowerCase();
    results = results.filter((s) => String(s['school'] ?? '').toLowerCase() === schoolLower);
  }

  res.json(paginate(results, pageNum, limitNum));
});

// ─── GET /api/content/items ────────────────────────────────────────────────
router.get('/items', (req, res) => {
  const { search, type, rarity, page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  let results: SRDRecord[] = allItems;

  if (search) {
    results = itemFuse.search(search).map((r) => r.item);
  }

  if (type) {
    const typeLower = type.toLowerCase();
    results = results.filter((i) => String(i['type'] ?? '').toLowerCase().includes(typeLower));
  }

  if (rarity) {
    results = results.filter((i) => i['rarity'] === rarity);
  }

  res.json(paginate(results, pageNum, limitNum));
});

// ─── GET /api/content/encounter-builder ───────────────────────────────────
router.get('/encounter-builder', (req, res) => {
  const { party, difficulty = 'medium' } = req.query as Record<string, string>;

  if (!party) {
    return res.status(400).json({ error: 'party parameter required (e.g. ?party=3,4,5)' });
  }

  const partyLevels = party.split(',').map(Number).filter((n) => n >= 1 && n <= 20);
  if (partyLevels.length === 0) {
    return res.status(400).json({ error: 'Invalid party levels' });
  }

  // Calculate party XP budget
  const diff = difficulty as 'easy' | 'medium' | 'hard' | 'deadly';
  const partyBudget = partyLevels.reduce((total, level) => {
    const threshold = XP_THRESHOLDS[Math.min(level, 20)];
    return total + (threshold?.[diff] ?? 0);
  }, 0);

  // Find monsters whose XP (with multiplier) fits the budget within 20%
  const suggestions: Array<{ monsters: SRDRecord[]; totalXP: number; adjustedXP: number; difficulty: string }> = [];

  const srdMonsters = monsters.filter((m) => typeof m['xp'] === 'number');

  // Try groups of 1, 2, 4 monsters
  for (const count of [1, 2, 4, 6]) {
    const multiplier = getMultiplier(count);
    const targetXP = partyBudget / multiplier;
    const xpPerMonster = targetXP / count;

    const match = srdMonsters.find((m) => Math.abs((m['xp'] as number) - xpPerMonster) < xpPerMonster * 0.3);
    if (match) {
      const totalXP = (match['xp'] as number) * count;
      const adjustedXP = totalXP * multiplier;
      suggestions.push({
        monsters: Array(count).fill(match),
        totalXP,
        adjustedXP: Math.round(adjustedXP),
        difficulty: adjustedXP >= partyBudget * 1.5 ? 'deadly' : adjustedXP >= partyBudget ? 'hard' : difficulty,
      });
    }
  }

  res.json({ partyBudget, difficulty, suggestions: suggestions.slice(0, 4) });
});

export default router;
