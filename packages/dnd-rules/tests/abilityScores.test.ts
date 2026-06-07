import { describe, it, expect } from 'vitest';
import {
  getAbilityModifier,
  getProficiencyBonus,
  rollAbilityScore,
  rollAbilityScoreSet,
  standardArray,
  pointBuyCost,
  validatePointBuy,
  pointBuySpent,
  POINT_BUY_BUDGET,
} from '../src/index.js';
import type { AbilityScore } from '../src/index.js';

describe('getAbilityModifier', () => {
  const cases: [number, number][] = [
    [1, -5],
    [8, -1],
    [9, -1],
    [10, 0],
    [11, 0],
    [12, 1],
    [13, 1],
    [14, 2],
    [15, 2],
    [18, 4],
    [20, 5],
    [30, 10],
  ];

  it.each(cases)('score %i → modifier %i', (score, expected) => {
    expect(getAbilityModifier(score)).toBe(expected);
  });
});

describe('getProficiencyBonus', () => {
  it.each([
    [1, 2], [4, 2],
    [5, 3], [8, 3],
    [9, 4], [12, 4],
    [13, 5], [16, 5],
    [17, 6], [20, 6],
  ] as [number, number][])('level %i → +%i', (level, expected) => {
    expect(getProficiencyBonus(level)).toBe(expected);
  });

  it('throws for level 0', () => expect(() => getProficiencyBonus(0)).toThrow());
  it('throws for level 21', () => expect(() => getProficiencyBonus(21)).toThrow());
});

describe('rollAbilityScore', () => {
  it('returns 4 rolls and 3 kept rolls', () => {
    const result = rollAbilityScore(42);
    expect(result.allRolls).toHaveLength(4);
    expect(result.keptRolls).toHaveLength(3);
  });

  it('score equals sum of kept rolls', () => {
    const result = rollAbilityScore(99);
    expect(result.score).toBe(result.keptRolls.reduce((s, r) => s + r, 0));
  });

  it('kept rolls are the highest 3 of 4', () => {
    const result = rollAbilityScore(7);
    const expected = [...result.allRolls].sort((a, b) => b - a).slice(0, 3).sort((a,b)=>a-b);
    const kept = [...result.keptRolls].sort((a, b) => a - b);
    expect(kept).toEqual(expected);
  });

  it('score is between 3 and 18', () => {
    for (let s = 0; s < 100; s++) {
      const { score } = rollAbilityScore(s);
      expect(score).toBeGreaterThanOrEqual(3);
      expect(score).toBeLessThanOrEqual(18);
    }
  });

  it('is deterministic with the same seed', () => {
    const r1 = rollAbilityScore(500);
    const r2 = rollAbilityScore(500);
    expect(r1.score).toBe(r2.score);
    expect(r1.allRolls).toEqual(r2.allRolls);
  });
});

describe('rollAbilityScoreSet', () => {
  it('returns 6 scores', () => {
    const set = rollAbilityScoreSet(1);
    expect(set).toHaveLength(6);
  });
});

describe('standardArray', () => {
  it('returns [15, 14, 13, 12, 10, 8]', () => {
    expect(standardArray()).toEqual([15, 14, 13, 12, 10, 8]);
  });

  it('returns a fresh array each call', () => {
    const a = standardArray();
    const b = standardArray();
    a.push(99);
    expect(b).not.toContain(99);
  });
});

describe('pointBuyCost', () => {
  it.each([
    [8, 0], [9, 1], [10, 2], [11, 3],
    [12, 4], [13, 5], [14, 7], [15, 9],
  ] as [number, number][])('score %i costs %i points', (score, cost) => {
    expect(pointBuyCost(score)).toBe(cost);
  });

  it('throws for score 7 (below minimum)', () => {
    expect(() => pointBuyCost(7)).toThrow();
  });

  it('throws for score 16 (above maximum)', () => {
    expect(() => pointBuyCost(16)).toThrow();
  });
});

describe('validatePointBuy', () => {
  const makeScores = (val: number): Record<AbilityScore, number> => ({
    strength: val,
    dexterity: val,
    constitution: val,
    intelligence: val,
    wisdom: val,
    charisma: val,
  });

  it('accepts all 8s (0 points)', () => {
    expect(validatePointBuy(makeScores(8))).toBe(true);
  });

  it('rejects scores that exceed budget', () => {
    // All 15s would cost 9*6 = 54 > 27
    expect(validatePointBuy(makeScores(15))).toBe(false);
  });

  it('accepts standard-ish allocation within budget', () => {
    const scores: Record<AbilityScore, number> = {
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    };
    // 9 + 7 + 5 + 4 + 2 + 0 = 27 — exactly at budget
    expect(validatePointBuy(scores)).toBe(true);
  });

  it('rejects score below 8', () => {
    const scores = makeScores(8);
    scores.strength = 7;
    expect(validatePointBuy(scores)).toBe(false);
  });

  it('rejects score above 15', () => {
    const scores = makeScores(8);
    scores.charisma = 16;
    expect(validatePointBuy(scores)).toBe(false);
  });
});

describe('pointBuySpent', () => {
  it('returns 0 for all 8s', () => {
    const scores: Record<AbilityScore, number> = {
      strength: 8, dexterity: 8, constitution: 8,
      intelligence: 8, wisdom: 8, charisma: 8,
    };
    expect(pointBuySpent(scores)).toBe(0);
  });

  it('returns 27 for exact budget allocation', () => {
    const scores: Record<AbilityScore, number> = {
      strength: 15, dexterity: 14, constitution: 13,
      intelligence: 12, wisdom: 10, charisma: 8,
    };
    expect(pointBuySpent(scores)).toBe(POINT_BUY_BUDGET);
  });
});
