import { describe, it, expect } from 'vitest';
import { applyWeaponMastery, ALL_WEAPON_MASTERIES } from '../src/index.js';
import type { AttackResult, CombatTarget, WeaponMastery } from '../src/index.js';

function makeHit(overrides: Partial<AttackResult> = {}): AttackResult {
  return {
    d20Result: 15,
    allD20Rolls: [15],
    total: 20,
    attackBonus: 5,
    advantageState: 'normal',
    isCrit: false,
    isCritFail: false,
    hits: true,
    targetAC: 15,
    ...overrides,
  };
}

function makeMiss(overrides: Partial<AttackResult> = {}): AttackResult {
  return {
    d20Result: 5,
    allD20Rolls: [5],
    total: 5,
    attackBonus: 0,
    advantageState: 'normal',
    isCrit: false,
    isCritFail: false,
    hits: false,
    targetAC: 15,
    ...overrides,
  };
}

function makeTarget(overrides: Partial<CombatTarget> = {}): CombatTarget {
  return {
    currentHP: 50,
    maxHP: 50,
    ac: 15,
    conMod: 1,
    speed: 30,
    isProne: false,
    hasSapDisadvantage: false,
    ...overrides,
  };
}

describe('ALL_WEAPON_MASTERIES', () => {
  it('contains all 8 properties', () => {
    expect(ALL_WEAPON_MASTERIES).toHaveLength(8);
    const expected: WeaponMastery[] = ['cleave','graze','nick','push','sap','slow','topple','vex'];
    for (const m of expected) {
      expect(ALL_WEAPON_MASTERIES).toContain(m);
    }
  });
});

describe('Cleave', () => {
  it('triggers on a hit, allows a cleave attack', () => {
    const effect = applyWeaponMastery('cleave', makeHit(), 3, 3, makeTarget());
    expect(effect.triggered).toBe(true);
    expect(effect.cleaveAttackAllowed).toBe(true);
  });

  it('does not trigger on a miss', () => {
    const effect = applyWeaponMastery('cleave', makeMiss(), 3, 3, makeTarget());
    expect(effect.triggered).toBe(false);
    expect(effect.cleaveAttackAllowed).toBe(false);
  });
});

describe('Graze', () => {
  it('triggers on a miss, deals ability modifier damage', () => {
    const target = makeTarget({ currentHP: 30 });
    const effect = applyWeaponMastery('graze', makeMiss(), 4, 3, target);
    expect(effect.triggered).toBe(true);
    expect(effect.grazeDamage).toBe(4);
    expect(effect.targetMutations.currentHP).toBe(26);
  });

  it('does not deal negative damage (mod 0)', () => {
    const target = makeTarget({ currentHP: 20 });
    const effect = applyWeaponMastery('graze', makeMiss(), 0, 3, target);
    expect(effect.grazeDamage).toBe(0);
  });

  it('does not trigger on a hit', () => {
    const effect = applyWeaponMastery('graze', makeHit(), 3, 3, makeTarget());
    expect(effect.triggered).toBe(false);
    expect(effect.grazeDamage).toBe(0);
  });
});

describe('Nick', () => {
  it('triggers on a hit', () => {
    const effect = applyWeaponMastery('nick', makeHit(), 2, 3, makeTarget());
    expect(effect.triggered).toBe(true);
  });

  it('does not trigger on a miss', () => {
    const effect = applyWeaponMastery('nick', makeMiss(), 2, 3, makeTarget());
    expect(effect.triggered).toBe(false);
  });
});

describe('Push', () => {
  it('triggers on a hit', () => {
    const effect = applyWeaponMastery('push', makeHit(), 3, 3, makeTarget());
    expect(effect.triggered).toBe(true);
  });

  it('does not trigger on a miss', () => {
    const effect = applyWeaponMastery('push', makeMiss(), 3, 3, makeTarget());
    expect(effect.triggered).toBe(false);
  });
});

describe('Sap', () => {
  it('imposes disadvantage on target next attack on hit', () => {
    const effect = applyWeaponMastery('sap', makeHit(), 3, 3, makeTarget());
    expect(effect.triggered).toBe(true);
    expect(effect.targetMutations.hasSapDisadvantage).toBe(true);
  });

  it('does not trigger on a miss', () => {
    const effect = applyWeaponMastery('sap', makeMiss(), 3, 3, makeTarget());
    expect(effect.triggered).toBe(false);
  });
});

describe('Slow', () => {
  it('reduces target speed by 10 on hit', () => {
    const target = makeTarget({ speed: 30 });
    const effect = applyWeaponMastery('slow', makeHit(), 3, 3, target);
    expect(effect.triggered).toBe(true);
    expect(effect.targetMutations.speed).toBe(20);
  });

  it('cannot reduce speed below 0', () => {
    const target = makeTarget({ speed: 5 });
    const effect = applyWeaponMastery('slow', makeHit(), 3, 3, target);
    expect(effect.targetMutations.speed).toBe(0);
  });
});

describe('Topple', () => {
  it('makes target prone when they fail the Con save', () => {
    // DC = 8 + 3 (prof) + 3 (str) = 14; save roll = 1, conMod = 0 → total 1 → fail
    const target = makeTarget({ conMod: 0 });
    const effect = applyWeaponMastery('topple', makeHit(), 3, 3, target, 1);
    expect(effect.triggered).toBe(true);
    expect(effect.targetMutations.isProne).toBe(true);
  });

  it('target is NOT prone when they pass the Con save', () => {
    // DC = 14; save roll = 20, conMod = 0 → total 20 → pass
    const target = makeTarget({ conMod: 0 });
    const effect = applyWeaponMastery('topple', makeHit(), 3, 3, target, 20);
    expect(effect.triggered).toBe(true);
    expect(effect.targetMutations.isProne).toBeUndefined();
  });

  it('does not trigger on a miss', () => {
    const effect = applyWeaponMastery('topple', makeMiss(), 3, 3, makeTarget(), 15);
    expect(effect.triggered).toBe(false);
  });
});

describe('Vex', () => {
  it('grants attacker advantage on next attack on hit', () => {
    const effect = applyWeaponMastery('vex', makeHit(), 3, 3, makeTarget());
    expect(effect.triggered).toBe(true);
    expect(effect.vexAdvantage).toBe(true);
  });

  it('does not trigger on a miss', () => {
    const effect = applyWeaponMastery('vex', makeMiss(), 3, 3, makeTarget());
    expect(effect.triggered).toBe(false);
    expect(effect.vexAdvantage).toBe(false);
  });
});
