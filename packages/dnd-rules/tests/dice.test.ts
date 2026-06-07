import { describe, it, expect } from 'vitest';
import {
  rollDice,
  rollD20,
  rollNd,
  mulberry32,
  rollWithAdvantage,
  rollWithDisadvantage,
  rollWithAdvantageState,
} from '../src/index.js';

describe('mulberry32 RNG', () => {
  it('produces values in [0, 1)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic with the same seed', () => {
    const rng1 = mulberry32(123);
    const rng2 = mulberry32(123);
    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('produces different sequences for different seeds', () => {
    const seq1 = Array.from({ length: 5 }, mulberry32(1));
    const seq2 = Array.from({ length: 5 }, mulberry32(2));
    expect(seq1).not.toEqual(seq2);
  });
});

describe('rollDice', () => {
  it('parses "1d6" notation', () => {
    const result = rollDice('1d6', 42);
    expect(result.rolls).toHaveLength(1);
    expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
    expect(result.rolls[0]).toBeLessThanOrEqual(6);
    expect(result.total).toBe(result.rolls[0]);
    expect(result.notation).toBe('1d6');
  });

  it('parses "2d6+3" notation', () => {
    const result = rollDice('2d6+3', 99);
    expect(result.rolls).toHaveLength(2);
    expect(result.modifier).toBe(3);
    expect(result.total).toBe(result.rolls[0] + result.rolls[1] + 3);
  });

  it('parses "1d8-2" notation with negative modifier', () => {
    const result = rollDice('1d8-2', 7);
    expect(result.modifier).toBe(-2);
    expect(result.total).toBe(result.rolls[0] - 2);
  });

  it('parses "4d6kh3" notation (keep highest 3)', () => {
    const result = rollDice('4d6kh3', 1);
    expect(result.rolls).toHaveLength(4);
    expect(result.keptRolls).toHaveLength(3);
    // Kept rolls should be the three highest
    const sorted = [...result.rolls].sort((a, b) => b - a).slice(0, 3);
    expect(result.keptRolls!.sort((a, b) => b - a)).toEqual(sorted);
    expect(result.total).toBe(result.keptRolls!.reduce((s, r) => s + r, 0));
  });

  it('parses "2d20kl1" notation (keep lowest 1 = disadvantage)', () => {
    const result = rollDice('2d20kl1', 5);
    expect(result.rolls).toHaveLength(2);
    expect(result.keptRolls).toHaveLength(1);
    expect(result.keptRolls![0]).toBe(Math.min(...result.rolls));
  });

  it('is deterministic with the same seed', () => {
    const r1 = rollDice('3d8+2', 42);
    const r2 = rollDice('3d8+2', 42);
    expect(r1.total).toBe(r2.total);
    expect(r1.rolls).toEqual(r2.rolls);
  });

  it('rolls are within die face range', () => {
    for (let seed = 0; seed < 50; seed++) {
      const result = rollDice('3d10', seed);
      for (const roll of result.rolls) {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(10);
      }
    }
  });

  it('throws on invalid notation', () => {
    expect(() => rollDice('invalid', 1)).toThrow();
    expect(() => rollDice('abc', 1)).toThrow();
  });
});

describe('rollD20', () => {
  it('returns a 1d20 roll', () => {
    const result = rollD20(10);
    expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
    expect(result.rolls[0]).toBeLessThanOrEqual(20);
    expect(result.rolls).toHaveLength(1);
  });
});

describe('rollNd', () => {
  it('rolls N dice of S sides', () => {
    const rolls = rollNd(5, 4, 7);
    expect(rolls).toHaveLength(5);
    for (const r of rolls) {
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(4);
    }
  });
});

describe('rollWithAdvantage', () => {
  it('returns two d20 rolls and keeps the highest', () => {
    const result = rollWithAdvantage(0, 42);
    expect(result.rolls).toHaveLength(2);
    expect(result.keptRoll).toBe(Math.max(...result.rolls));
    expect(result.advantageState).toBe('advantage');
  });

  it('isCrit when kept roll is 20', () => {
    // Run enough seeds to find a crit
    let foundCrit = false;
    for (let s = 0; s < 200; s++) {
      const r = rollWithAdvantage(0, s);
      if (r.isCrit) { foundCrit = true; break; }
    }
    expect(foundCrit).toBe(true);
  });
});

describe('rollWithDisadvantage', () => {
  it('returns two d20 rolls and keeps the lowest', () => {
    const result = rollWithDisadvantage(0, 77);
    expect(result.rolls).toHaveLength(2);
    expect(result.keptRoll).toBe(Math.min(...result.rolls));
    expect(result.advantageState).toBe('disadvantage');
  });
});

describe('rollWithAdvantageState', () => {
  it('normal state rolls a single d20 and adds modifier', () => {
    const result = rollWithAdvantageState('normal', 3, 55);
    expect(result.rolls).toHaveLength(1);
    expect(result.total).toBe(result.rolls[0] + 3);
  });

  it('isCritFail when kept roll is 1 (normal)', () => {
    let found = false;
    for (let s = 0; s < 1000; s++) {
      const r = rollWithAdvantageState('normal', 0, s);
      if (r.isCritFail) { found = true; break; }
    }
    expect(found).toBe(true);
  });
});
