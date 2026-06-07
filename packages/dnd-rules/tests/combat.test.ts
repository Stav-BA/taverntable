import { describe, it, expect } from 'vitest';
import {
  rollInitiative,
  sortInitiative,
  calculateAC,
  rollAttack,
  resolveHit,
  rollDamage,
  createTurnResources,
  spendAction,
  startOfTurn,
  move,
} from '../src/index.js';

describe('rollInitiative', () => {
  it('returns total = d20 roll + dexMod (normal)', () => {
    const result = rollInitiative(3, false, 42);
    expect(result.dexMod).toBe(3);
    expect(result.surprised).toBe(false);
    expect(result.total).toBe(result.keptRoll + 3);
  });

  it('surprised creatures use disadvantage', () => {
    const result = rollInitiative(0, true, 10);
    expect(result.advantageState).toBe('disadvantage');
    expect(result.rolls).toHaveLength(2);
    expect(result.keptRoll).toBe(Math.min(...result.rolls));
  });
});

describe('sortInitiative', () => {
  it('sorts highest total first', () => {
    const initiatives = [
      rollInitiative(0, false, 1),
      rollInitiative(0, false, 2),
      rollInitiative(0, false, 3),
    ];
    const sorted = sortInitiative(initiatives);
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].total).toBeGreaterThanOrEqual(sorted[i + 1].total);
    }
  });
});

describe('calculateAC', () => {
  it('unarmored: base + dex', () => {
    expect(calculateAC(10, 3, 'unarmored')).toBe(13);
  });

  it('light armor: base + full dex', () => {
    expect(calculateAC(11, 4, 'light')).toBe(15);
  });

  it('medium armor: base + max 2 dex', () => {
    expect(calculateAC(14, 5, 'medium')).toBe(16);
    expect(calculateAC(14, 1, 'medium')).toBe(15);
  });

  it('heavy armor: base, no dex', () => {
    expect(calculateAC(18, 5, 'heavy')).toBe(18);
  });

  it('natural armor: base + dex', () => {
    expect(calculateAC(13, 2, 'natural')).toBe(15);
  });
});

describe('rollAttack', () => {
  it('returns normal attack roll', () => {
    const result = rollAttack(5, 'normal', 100);
    expect(result.attackBonus).toBe(5);
    expect(result.total).toBe(result.d20Result + 5);
    expect(result.advantageState).toBe('normal');
  });

  it('advantage: keeps highest of 2 d20s', () => {
    const result = rollAttack(0, 'advantage', 200);
    expect(result.allD20Rolls).toHaveLength(2);
    expect(result.d20Result).toBe(Math.max(...result.allD20Rolls));
  });

  it('disadvantage: keeps lowest of 2 d20s', () => {
    const result = rollAttack(0, 'disadvantage', 300);
    expect(result.allD20Rolls).toHaveLength(2);
    expect(result.d20Result).toBe(Math.min(...result.allD20Rolls));
  });

  it('isCrit when d20 result is 20', () => {
    let foundCrit = false;
    for (let s = 0; s < 500; s++) {
      const r = rollAttack(0, 'normal', s);
      if (r.isCrit) { foundCrit = true; break; }
    }
    expect(foundCrit).toBe(true);
  });

  it('isCritFail when d20 result is 1', () => {
    let foundFail = false;
    for (let s = 0; s < 500; s++) {
      const r = rollAttack(0, 'normal', s);
      if (r.isCritFail) { foundFail = true; break; }
    }
    expect(foundFail).toBe(true);
  });
});

describe('resolveHit', () => {
  it('hits when total >= AC', () => {
    const attack = rollAttack(10, 'normal', 42);
    // Force a specific result by finding a seed where d20Result is known
    const result = resolveHit({ ...attack, d20Result: 15, total: 25, isCrit: false, isCritFail: false }, 15);
    expect(result.hits).toBe(true);
  });

  it('misses when total < AC', () => {
    const attack = rollAttack(0, 'normal', 42);
    const result = resolveHit({ ...attack, d20Result: 5, total: 5, isCrit: false, isCritFail: false }, 20);
    expect(result.hits).toBe(false);
  });

  it('critical hit always hits', () => {
    const attack = { d20Result: 20, allD20Rolls: [20], total: 20, attackBonus: 0, advantageState: 'normal' as const, isCrit: true, isCritFail: false };
    expect(resolveHit(attack, 99).hits).toBe(true);
  });

  it('critical fail always misses', () => {
    const attack = { d20Result: 1, allD20Rolls: [1], total: 11, attackBonus: 10, advantageState: 'normal' as const, isCrit: false, isCritFail: true };
    expect(resolveHit(attack, 10).hits).toBe(false);
  });
});

describe('rollDamage', () => {
  it('normal hit: rolls damage dice + modifier', () => {
    const result = rollDamage('1d8', 3, false, 'slashing', 5);
    expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
    expect(result.rolls[0]).toBeLessThanOrEqual(8);
    expect(result.total).toBe(result.rolls[0] + 3);
    expect(result.damageType).toBe('slashing');
  });

  it('crit hit: doubles dice (2d8 instead of 1d8)', () => {
    const result = rollDamage('1d8', 0, true, undefined, 7);
    // Should have 2 rolls (doubled dice)
    expect(result.rolls).toHaveLength(2);
    expect(result.total).toBe(result.rolls[0] + result.rolls[1]);
  });

  it('2d6 crit → 4d6', () => {
    const result = rollDamage('2d6', 2, true, undefined, 9);
    expect(result.rolls).toHaveLength(4);
    expect(result.total).toBe(result.rolls.reduce((s, r) => s + r, 0) + 2);
  });

  it('is deterministic', () => {
    const r1 = rollDamage('2d8', 4, false, undefined, 11);
    const r2 = rollDamage('2d8', 4, false, undefined, 11);
    expect(r1.total).toBe(r2.total);
  });
});

describe('Action Economy (turn resources)', () => {
  it('createTurnResources sets all resources available', () => {
    const r = createTurnResources(30);
    expect(r.action).toBe(true);
    expect(r.bonusAction).toBe(true);
    expect(r.reaction).toBe(true);
    expect(r.movementRemaining).toBe(30);
    expect(r.speed).toBe(30);
  });

  it('spendAction removes an action', () => {
    const r = createTurnResources(30);
    const spent = spendAction(r, 'action');
    expect(spent.action).toBe(false);
    expect(spent.bonusAction).toBe(true);
  });

  it('spendAction throws when action already spent', () => {
    const r = createTurnResources(30);
    const spent = spendAction(r, 'action');
    expect(() => spendAction(spent, 'action')).toThrow();
  });

  it('move reduces movementRemaining', () => {
    const r = createTurnResources(30);
    const moved = move(r, 15);
    expect(moved.movementRemaining).toBe(15);
  });

  it('move throws when exceeding remaining movement', () => {
    const r = createTurnResources(30);
    expect(() => move(r, 35)).toThrow();
  });

  it('startOfTurn restores all resources', () => {
    let r = createTurnResources(30);
    r = spendAction(r, 'action');
    r = spendAction(r, 'bonusAction');
    r = move(r, 20);
    const restored = startOfTurn(r);
    expect(restored.action).toBe(true);
    expect(restored.bonusAction).toBe(true);
    expect(restored.reaction).toBe(true);
    expect(restored.movementRemaining).toBe(30);
  });
});
