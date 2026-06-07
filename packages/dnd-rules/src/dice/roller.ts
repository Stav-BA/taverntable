/**
 * Dice rolling engine for D&D 5e 2024
 * Uses seeded Mulberry32 RNG for deterministic results
 */

export interface DiceResult {
  total: number;
  rolls: number[];
  modifier: number;
  notation: string;
  keptRolls?: number[];
}

/**
 * Mulberry32 seeded PRNG — fast, good distribution
 */
export function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Global PRNG state (replaced per roll when seed is provided) */
let _rng: () => number = Math.random;

function getRng(seed?: number): () => number {
  if (seed !== undefined) {
    return mulberry32(seed);
  }
  return Math.random;
}

/**
 * Roll a single die with `sides` faces using the provided rng.
 */
function rollOne(sides: number, rng: () => number): number {
  return Math.floor(rng() * sides) + 1;
}

/**
 * Notation grammar supported:
 *   NdS           – roll N dice of S sides
 *   NdS+M / NdS-M – with numeric modifier
 *   NdSkh K       – keep highest K  (e.g. 4d6kh3)
 *   NdSkl K       – keep lowest K
 */
function parseNotation(notation: string): {
  count: number;
  sides: number;
  modifier: number;
  keepMode: 'highest' | 'lowest' | null;
  keepCount: number;
} {
  // Normalise input
  const raw = notation.trim().toLowerCase().replace(/\s+/g, '');

  // e.g. 4d6kh3 or 4d6kl1
  const keepPattern = /^(\d+)d(\d+)k([hl])(\d+)([+-]\d+)?$/;
  // e.g. 2d6+3 or 1d20-1 or 3d8
  const simplePattern = /^(\d+)d(\d+)([+-]\d+)?$/;

  let keepMatch = raw.match(keepPattern);
  let simpleMatch = raw.match(simplePattern);

  if (keepMatch) {
    return {
      count: parseInt(keepMatch[1], 10),
      sides: parseInt(keepMatch[2], 10),
      modifier: keepMatch[5] ? parseInt(keepMatch[5], 10) : 0,
      keepMode: keepMatch[3] === 'h' ? 'highest' : 'lowest',
      keepCount: parseInt(keepMatch[4], 10),
    };
  }

  if (simpleMatch) {
    return {
      count: parseInt(simpleMatch[1], 10),
      sides: parseInt(simpleMatch[2], 10),
      modifier: simpleMatch[3] ? parseInt(simpleMatch[3], 10) : 0,
      keepMode: null,
      keepCount: 0,
    };
  }

  throw new Error(`Invalid dice notation: "${notation}"`);
}

/**
 * Roll dice from a notation string.
 *
 * @param notation – e.g. "2d6+3", "4d6kh3", "1d20"
 * @param seed     – optional seed for deterministic results
 */
export function rollDice(notation: string, seed?: number): DiceResult {
  const rng = getRng(seed);
  const { count, sides, modifier, keepMode, keepCount } = parseNotation(notation);

  if (count < 1 || sides < 1) {
    throw new Error(`Invalid dice parameters: count=${count}, sides=${sides}`);
  }

  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(rollOne(sides, rng));
  }

  let keptRolls: number[];

  if (keepMode === null) {
    keptRolls = rolls;
  } else if (keepMode === 'highest') {
    keptRolls = [...rolls].sort((a, b) => b - a).slice(0, keepCount);
  } else {
    keptRolls = [...rolls].sort((a, b) => a - b).slice(0, keepCount);
  }

  const total = keptRolls.reduce((sum, r) => sum + r, 0) + modifier;

  return {
    total,
    rolls,
    modifier,
    notation,
    keptRolls: keepMode !== null ? keptRolls : undefined,
  };
}

/**
 * Roll a single d20.
 */
export function rollD20(seed?: number): DiceResult {
  return rollDice('1d20', seed);
}

/**
 * Roll N dice of S sides, returning raw results (no modifier).
 * Convenience helper used internally.
 */
export function rollNd(count: number, sides: number, seed?: number): number[] {
  const rng = getRng(seed);
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    results.push(rollOne(sides, rng));
  }
  return results;
}
