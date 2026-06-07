import { describe, it, expect } from 'vitest';
import {
  getSpellSlots,
  canCastSpell,
  expendSlot,
  restoreSlots,
  getWarlockPactMagic,
  rollConcentrationCheck,
  validateCastLevel,
  upcasting,
  cantripDiceCount,
} from '../src/index.js';

describe('getSpellSlots — Full casters', () => {
  const fullClasses = ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'];

  for (const cls of fullClasses) {
    it(`${cls} level 1 has 2 first-level slots`, () => {
      const table = getSpellSlots(cls, 1);
      expect(table.slots[1]).toBe(2);
      expect(table.slots[2]).toBe(0);
    });

    it(`${cls} level 5 has 3rd-level slots`, () => {
      const table = getSpellSlots(cls, 5);
      expect(table.slots[3]).toBeGreaterThan(0);
    });

    it(`${cls} level 20 has 9th-level slots`, () => {
      const table = getSpellSlots(cls, 20);
      expect(table.slots[9]).toBeGreaterThan(0);
    });
  }
});

describe('getSpellSlots — Half casters', () => {
  it('paladin level 1 has no spell slots', () => {
    const table = getSpellSlots('paladin', 1);
    expect(table.slots[1]).toBe(0);
  });

  it('paladin level 2 has 2 first-level slots', () => {
    const table = getSpellSlots('paladin', 2);
    expect(table.slots[1]).toBe(2);
  });

  it('ranger level 5 has 2nd-level slots', () => {
    const table = getSpellSlots('ranger', 5);
    expect(table.slots[2]).toBeGreaterThan(0);
  });

  it('paladin level 20 has max 5th-level slots', () => {
    const table = getSpellSlots('paladin', 20);
    expect(table.slots[5]).toBeGreaterThan(0);
    expect(table.slots[6]).toBe(0);
  });
});

describe('getSpellSlots — Third casters', () => {
  it('eldritch knight level 1-2 have no slots', () => {
    expect(getSpellSlots('eldritch knight', 1).slots[1]).toBe(0);
    expect(getSpellSlots('eldritch knight', 2).slots[1]).toBe(0);
  });

  it('eldritch knight level 3 has 2 first-level slots', () => {
    const table = getSpellSlots('eldritch knight', 3);
    expect(table.slots[1]).toBe(2);
  });
});

describe('getSpellSlots — Warlock', () => {
  it('warlock level 1 has 1 pact slot at level 1', () => {
    const table = getSpellSlots('warlock', 1);
    expect(table.slots[1]).toBe(1);
  });

  it('warlock level 5 has 2 pact slots at level 3', () => {
    const table = getSpellSlots('warlock', 5);
    expect(table.slots[3]).toBe(2);
  });

  it('warlock level 9+ has pact slots at level 5', () => {
    const table = getSpellSlots('warlock', 9);
    expect(table.slots[5]).toBe(2);
  });
});

describe('getWarlockPactMagic', () => {
  it('level 3 warlock: 2nd level slots × 2', () => {
    const pact = getWarlockPactMagic(3);
    expect(pact.slotLevel).toBe(2);
    expect(pact.slotCount).toBe(2);
  });

  it('level 11 warlock: 5th level slots × 3', () => {
    const pact = getWarlockPactMagic(11);
    expect(pact.slotLevel).toBe(5);
    expect(pact.slotCount).toBe(3);
  });
});

describe('canCastSpell', () => {
  it('returns true when slots available', () => {
    const table = getSpellSlots('wizard', 5);
    expect(canCastSpell(table, 1)).toBe(true);
    expect(canCastSpell(table, 3)).toBe(true);
  });

  it('returns false for levels with 0 slots', () => {
    const table = getSpellSlots('wizard', 1);
    expect(canCastSpell(table, 2)).toBe(false);
  });

  it('returns false for invalid spell level', () => {
    const table = getSpellSlots('wizard', 20);
    expect(canCastSpell(table, 0)).toBe(false);
    expect(canCastSpell(table, 10)).toBe(false);
  });
});

describe('expendSlot', () => {
  it('reduces slot count by 1', () => {
    const table = getSpellSlots('cleric', 3);
    const before = table.slots[1];
    const after = expendSlot(table, 1);
    expect(after.slots[1]).toBe(before - 1);
  });

  it('throws when no slots remaining', () => {
    let table = getSpellSlots('cleric', 1);
    table = expendSlot(table, 1);
    table = expendSlot(table, 1);
    // Level 1 cleric has 2 slots; now 0 remain
    expect(() => expendSlot(table, 1)).toThrow();
  });
});

describe('restoreSlots', () => {
  it('long rest restores all slots for full caster', () => {
    let table = getSpellSlots('wizard', 5);
    table = expendSlot(table, 1);
    table = expendSlot(table, 2);
    const restored = restoreSlots(table, 'long', 'wizard');
    expect(restored.slots).toEqual(getSpellSlots('wizard', 5).slots);
  });

  it('short rest restores warlock pact slots', () => {
    let table = getSpellSlots('warlock', 5);
    table = expendSlot(table, 3);
    table = expendSlot(table, 3);
    const restored = restoreSlots(table, 'short', 'warlock');
    expect(restored.slots[3]).toBe(getSpellSlots('warlock', 5).slots[3]);
  });

  it('short rest does NOT restore wizard slots', () => {
    let table = getSpellSlots('wizard', 5);
    table = expendSlot(table, 1);
    const restored = restoreSlots(table, 'short', 'wizard');
    expect(restored.slots[1]).toBe(table.slots[1]); // unchanged
  });
});

describe('rollConcentrationCheck', () => {
  it('DC = 10 when damage < 20', () => {
    const state = { spellName: 'Hold Person', hasWarCaster: false, hasResilientConstitution: false, conMod: 2, proficiencyBonus: 3 };
    const result = rollConcentrationCheck(15, state, 42);
    expect(result.dc).toBe(10);
  });

  it('DC = floor(damage/2) when damage >= 20', () => {
    const state = { spellName: 'Hold Person', hasWarCaster: false, hasResilientConstitution: false, conMod: 0, proficiencyBonus: 2 };
    const result = rollConcentrationCheck(30, state, 42);
    expect(result.dc).toBe(15);
  });

  it('War Caster grants advantage', () => {
    const state = { spellName: 'Fly', hasWarCaster: true, hasResilientConstitution: false, conMod: 1, proficiencyBonus: 3 };
    const result = rollConcentrationCheck(10, state, 100);
    expect(result.roll.advantageState).toBe('advantage');
    expect(result.roll.rolls).toHaveLength(2);
  });

  it('Resilient Constitution adds prof bonus to save', () => {
    const state = { spellName: 'Web', hasWarCaster: false, hasResilientConstitution: true, conMod: 2, proficiencyBonus: 4 };
    const result = rollConcentrationCheck(10, state, 50);
    expect(result.saveTotal).toBe(result.roll.keptRoll + 2 + 4);
  });

  it('maintained = true when save total >= DC', () => {
    const state = { spellName: 'Haste', hasWarCaster: false, hasResilientConstitution: false, conMod: 5, proficiencyBonus: 2 };
    // With +5 con mod, almost always passes DC 10
    let maintained = 0;
    for (let s = 0; s < 30; s++) {
      const r = rollConcentrationCheck(10, state, s);
      if (r.maintained) maintained++;
    }
    expect(maintained).toBeGreaterThanOrEqual(25);
  });
});

describe('validateCastLevel', () => {
  it('valid upcast', () => {
    expect(validateCastLevel({ baseLevel: 1, castLevel: 3 })).toBe(true);
  });

  it('same level as base', () => {
    expect(validateCastLevel({ baseLevel: 5, castLevel: 5 })).toBe(true);
  });

  it('invalid: cast level below base', () => {
    expect(validateCastLevel({ baseLevel: 3, castLevel: 2 })).toBe(false);
  });
});

describe('upcasting', () => {
  it('returns 0 when cast at base level', () => {
    expect(upcasting({ baseLevel: 2, castLevel: 2 })).toBe(0);
  });

  it('returns difference when upcast', () => {
    expect(upcasting({ baseLevel: 1, castLevel: 4 })).toBe(3);
  });
});

describe('cantripDiceCount', () => {
  it.each([
    [1, 1], [4, 1],
    [5, 2], [10, 2],
    [11, 3], [16, 3],
    [17, 4], [20, 4],
  ] as [number, number][])('level %i → %i dice', (level, count) => {
    expect(cantripDiceCount(level)).toBe(count);
  });
});
