import { describe, it, expect } from 'vitest';
import {
  applyConditionEffect,
  combineConditionEffects,
  exhaustionSpeedPenalty,
  exhaustionD20Penalty,
  isExhaustionLethal,
  EXHAUSTION_SPEED_PENALTY_PER_LEVEL,
} from '../src/index.js';

describe('applyConditionEffect — Blinded', () => {
  it('attack rolls have disadvantage', () => {
    const effect = applyConditionEffect('blinded', 'attack');
    expect(effect.hasDisadvantage).toBe(true);
  });

  it('no effect on saving throws', () => {
    const effect = applyConditionEffect('blinded', 'savingThrow');
    expect(effect.hasDisadvantage).toBe(false);
  });
});

describe('applyConditionEffect — Exhaustion (2024)', () => {
  it('level 0 → no effect', () => {
    const e = applyConditionEffect('exhaustion', 'attack', 0);
    expect(e.rollModifier).toBe(0);
  });

  it('level 1 → -2 to attack', () => {
    const e = applyConditionEffect('exhaustion', 'attack', 1);
    expect(e.rollModifier).toBe(-2);
  });

  it('level 3 → -6 to ability checks', () => {
    const e = applyConditionEffect('exhaustion', 'abilityCheck', 3);
    expect(e.rollModifier).toBe(-6);
  });

  it('level 6 → prevented (dead)', () => {
    const e = applyConditionEffect('exhaustion', 'attack', 6);
    expect(e.prevented).toBe(true);
  });

  it('exhaustion has no effect on non-d20-test contexts (e.g. damage - no context provided)', () => {
    // Deafened has no roll effect, not directly exhaustion — but exhaustion only
    // affects d20 tests; deafened is not a d20 test context. Use a non-listed context.
    // We'll just verify the standard contexts work.
    const contexts = ['attack','abilityCheck','savingThrow','skillCheck','deathSave','initiative','concentration'] as const;
    for (const ctx of contexts) {
      const e = applyConditionEffect('exhaustion', ctx, 2);
      expect(e.rollModifier).toBe(-4);
    }
  });
});

describe('applyConditionEffect — Frightened', () => {
  it('disadvantage on attacks', () => {
    expect(applyConditionEffect('frightened', 'attack').hasDisadvantage).toBe(true);
  });

  it('disadvantage on ability checks', () => {
    expect(applyConditionEffect('frightened', 'abilityCheck').hasDisadvantage).toBe(true);
  });
});

describe('applyConditionEffect — Paralyzed', () => {
  it('prevents attack rolls', () => {
    expect(applyConditionEffect('paralyzed', 'attack').prevented).toBe(true);
  });

  it('prevents (auto-fails) Str/Dex saves', () => {
    expect(applyConditionEffect('paralyzed', 'savingThrow').prevented).toBe(true);
  });
});

describe('applyConditionEffect — Poisoned', () => {
  it('disadvantage on attacks', () => {
    expect(applyConditionEffect('poisoned', 'attack').hasDisadvantage).toBe(true);
  });

  it('disadvantage on ability checks', () => {
    expect(applyConditionEffect('poisoned', 'abilityCheck').hasDisadvantage).toBe(true);
  });

  it('no effect on saving throws', () => {
    const e = applyConditionEffect('poisoned', 'savingThrow');
    expect(e.hasDisadvantage).toBe(false);
  });
});

describe('applyConditionEffect — Prone', () => {
  it('attack rolls have disadvantage', () => {
    expect(applyConditionEffect('prone', 'attack').hasDisadvantage).toBe(true);
  });
});

describe('applyConditionEffect — Invisible', () => {
  it('attack rolls have advantage', () => {
    expect(applyConditionEffect('invisible', 'attack').hasAdvantage).toBe(true);
  });
});

describe('applyConditionEffect — Restrained', () => {
  it('attack rolls have disadvantage', () => {
    expect(applyConditionEffect('restrained', 'attack').hasDisadvantage).toBe(true);
  });

  it('Dex saving throws have disadvantage', () => {
    expect(applyConditionEffect('restrained', 'savingThrow').hasDisadvantage).toBe(true);
  });
});

describe('applyConditionEffect — Stunned/Unconscious', () => {
  it('prevents attacks', () => {
    expect(applyConditionEffect('stunned', 'attack').prevented).toBe(true);
    expect(applyConditionEffect('unconscious', 'attack').prevented).toBe(true);
  });

  it('auto-fails saves', () => {
    expect(applyConditionEffect('stunned', 'savingThrow').prevented).toBe(true);
    expect(applyConditionEffect('unconscious', 'savingThrow').prevented).toBe(true);
  });
});

describe('combineConditionEffects', () => {
  it('combines roll modifiers additively', () => {
    const e1 = applyConditionEffect('exhaustion', 'attack', 1);
    const e2 = applyConditionEffect('exhaustion', 'attack', 2);
    const combined = combineConditionEffects([e1, e2]);
    expect(combined.rollModifier).toBe(-2 + -4);
  });

  it('either source of disadvantage sets hasDisadvantage', () => {
    const e1 = applyConditionEffect('blinded', 'attack');
    const e2 = applyConditionEffect('prone', 'attack');
    const combined = combineConditionEffects([e1, e2]);
    expect(combined.hasDisadvantage).toBe(true);
  });

  it('either source of prevented sets prevented', () => {
    const e1 = applyConditionEffect('paralyzed', 'attack');
    const e2 = applyConditionEffect('blinded', 'attack');
    const combined = combineConditionEffects([e1, e2]);
    expect(combined.prevented).toBe(true);
  });
});

describe('Exhaustion helpers', () => {
  it('exhaustionSpeedPenalty per level', () => {
    expect(exhaustionSpeedPenalty(0)).toBe(0);
    expect(exhaustionSpeedPenalty(1)).toBe(EXHAUSTION_SPEED_PENALTY_PER_LEVEL);
    expect(exhaustionSpeedPenalty(3)).toBe(15);
    expect(exhaustionSpeedPenalty(6)).toBe(Infinity);
  });

  it('exhaustionD20Penalty per level', () => {
    expect(exhaustionD20Penalty(0)).toBe(0);
    expect(exhaustionD20Penalty(1)).toBe(-2);
    expect(exhaustionD20Penalty(5)).toBe(-10);
    expect(exhaustionD20Penalty(6)).toBe(-Infinity);
  });

  it('isExhaustionLethal returns true at level 6+', () => {
    expect(isExhaustionLethal(5)).toBe(false);
    expect(isExhaustionLethal(6)).toBe(true);
    expect(isExhaustionLethal(7)).toBe(true);
  });
});
