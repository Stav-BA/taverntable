/**
 * Conditions — D&D 5e 2024
 *
 * Includes all 15 standard conditions plus the 2024 Exhaustion rules.
 *
 * 2024 Exhaustion:
 *   - Stackable 1–6 levels
 *   - Each level: −2 penalty to all d20 Tests and −5 ft speed
 *   - Level 6: creature dies
 */

export type Condition =
  | 'blinded'
  | 'charmed'
  | 'deafened'
  | 'exhaustion'
  | 'frightened'
  | 'grappled'
  | 'incapacitated'
  | 'invisible'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious';

export type RollContext =
  | 'attack'
  | 'abilityCheck'
  | 'savingThrow'
  | 'skillCheck'
  | 'deathSave'
  | 'initiative'
  | 'concentration';

/** Which roll contexts count as a "d20 Test" for Exhaustion. */
const D20_TEST_CONTEXTS: RollContext[] = [
  'attack',
  'abilityCheck',
  'savingThrow',
  'skillCheck',
  'deathSave',
  'initiative',
  'concentration',
];

export interface ConditionEffect {
  /** Flat modifier to the roll (e.g. exhaustion penalty). */
  rollModifier: number;
  /** Whether the roll should be made with advantage. */
  hasAdvantage: boolean;
  /** Whether the roll should be made with disadvantage. */
  hasDisadvantage: boolean;
  /** Whether the action/roll is simply prevented. */
  prevented: boolean;
  /** Human-readable description of the effect. */
  description: string;
}

function noEffect(): ConditionEffect {
  return {
    rollModifier: 0,
    hasAdvantage: false,
    hasDisadvantage: false,
    prevented: false,
    description: 'No effect on this roll',
  };
}

/**
 * Apply the mechanical effect of a condition to a particular roll context.
 *
 * For conditions that grant advantage/disadvantage the caller is responsible for
 * combining multiple effects (see `combineConditionEffects`).
 *
 * @param condition  – the condition being applied
 * @param context    – the type of roll being made
 * @param exhaustionLevel – current exhaustion level (0–6); only relevant for exhaustion
 */
export function applyConditionEffect(
  condition: Condition,
  context: RollContext,
  exhaustionLevel = 0,
): ConditionEffect {
  switch (condition) {
    // ── Blinded ────────────────────────────────────────────────────────────
    case 'blinded':
      if (context === 'attack') {
        return {
          ...noEffect(),
          hasDisadvantage: true,
          description: 'Blinded: Attack rolls have Disadvantage',
        };
      }
      // Attacks against a blinded creature have advantage — handled by the
      // defender's token; this function is always from the affected creature's
      // perspective.
      return noEffect();

    // ── Charmed ────────────────────────────────────────────────────────────
    case 'charmed':
      // The charmed creature can't attack the charmer and the charmer has
      // advantage on social checks — no mechanical roll modifier here beyond that.
      return noEffect();

    // ── Deafened ───────────────────────────────────────────────────────────
    case 'deafened':
      return noEffect(); // No mechanical roll effect beyond RP

    // ── Exhaustion (2024) ──────────────────────────────────────────────────
    case 'exhaustion': {
      if (exhaustionLevel <= 0) return noEffect();
      if (exhaustionLevel >= 6) {
        return {
          ...noEffect(),
          prevented: true,
          description: 'Exhaustion 6: Creature is dead',
        };
      }
      if (D20_TEST_CONTEXTS.includes(context)) {
        const penalty = -2 * exhaustionLevel;
        return {
          ...noEffect(),
          rollModifier: penalty,
          description: `Exhaustion ${exhaustionLevel}: ${penalty} to all d20 Tests`,
        };
      }
      return noEffect();
    }

    // ── Frightened ─────────────────────────────────────────────────────────
    case 'frightened':
      if (context === 'attack' || context === 'abilityCheck' || context === 'skillCheck') {
        return {
          ...noEffect(),
          hasDisadvantage: true,
          description: 'Frightened: Disadvantage while source of fear is in sight',
        };
      }
      return noEffect();

    // ── Grappled ───────────────────────────────────────────────────────────
    case 'grappled':
      // Speed becomes 0 — no roll effect
      return noEffect();

    // ── Incapacitated ──────────────────────────────────────────────────────
    case 'incapacitated':
      if (context === 'attack' || context === 'concentration') {
        return {
          ...noEffect(),
          prevented: true,
          description: 'Incapacitated: Cannot take actions or reactions',
        };
      }
      return noEffect();

    // ── Invisible ──────────────────────────────────────────────────────────
    case 'invisible':
      if (context === 'attack') {
        return {
          ...noEffect(),
          hasAdvantage: true,
          description: 'Invisible: Attack rolls have Advantage',
        };
      }
      return noEffect();

    // ── Paralyzed ──────────────────────────────────────────────────────────
    case 'paralyzed':
      if (
        context === 'attack' ||
        context === 'abilityCheck' ||
        context === 'skillCheck' ||
        context === 'concentration'
      ) {
        return {
          ...noEffect(),
          prevented: true,
          description: 'Paralyzed: Cannot take actions or reactions; auto-fail Str/Dex saves',
        };
      }
      if (context === 'savingThrow') {
        // Str and Dex saving throws automatically fail — represented as prevented
        return {
          ...noEffect(),
          prevented: true,
          description: 'Paralyzed: Automatically fail Strength and Dexterity saving throws',
        };
      }
      return noEffect();

    // ── Petrified ──────────────────────────────────────────────────────────
    case 'petrified':
      if (
        context === 'attack' ||
        context === 'abilityCheck' ||
        context === 'skillCheck' ||
        context === 'concentration'
      ) {
        return {
          ...noEffect(),
          prevented: true,
          description: 'Petrified: Incapacitated, auto-fail Str/Dex saves',
        };
      }
      if (context === 'savingThrow') {
        return {
          ...noEffect(),
          prevented: true,
          description: 'Petrified: Automatically fail Strength and Dexterity saving throws',
        };
      }
      return noEffect();

    // ── Poisoned ───────────────────────────────────────────────────────────
    case 'poisoned':
      if (context === 'attack' || context === 'abilityCheck' || context === 'skillCheck') {
        return {
          ...noEffect(),
          hasDisadvantage: true,
          description: 'Poisoned: Disadvantage on Attack rolls and Ability Checks',
        };
      }
      return noEffect();

    // ── Prone ──────────────────────────────────────────────────────────────
    case 'prone':
      if (context === 'attack') {
        return {
          ...noEffect(),
          hasDisadvantage: true,
          description: 'Prone: Disadvantage on Attack rolls',
        };
      }
      return noEffect();

    // ── Restrained ─────────────────────────────────────────────────────────
    case 'restrained':
      if (context === 'attack') {
        return {
          ...noEffect(),
          hasDisadvantage: true,
          description: 'Restrained: Disadvantage on Attack rolls',
        };
      }
      if (context === 'savingThrow') {
        return {
          ...noEffect(),
          hasDisadvantage: true,
          description: 'Restrained: Disadvantage on Dexterity Saving Throws',
        };
      }
      return noEffect();

    // ── Stunned ────────────────────────────────────────────────────────────
    case 'stunned':
      if (
        context === 'attack' ||
        context === 'abilityCheck' ||
        context === 'skillCheck' ||
        context === 'concentration'
      ) {
        return {
          ...noEffect(),
          prevented: true,
          description: 'Stunned: Incapacitated, auto-fail Str/Dex saves',
        };
      }
      if (context === 'savingThrow') {
        return {
          ...noEffect(),
          prevented: true,
          description: 'Stunned: Automatically fail Strength and Dexterity saving throws',
        };
      }
      return noEffect();

    // ── Unconscious ────────────────────────────────────────────────────────
    case 'unconscious':
      if (
        context === 'attack' ||
        context === 'abilityCheck' ||
        context === 'skillCheck' ||
        context === 'concentration'
      ) {
        return {
          ...noEffect(),
          prevented: true,
          description: 'Unconscious: Incapacitated, auto-fail Str/Dex saves',
        };
      }
      if (context === 'savingThrow') {
        return {
          ...noEffect(),
          prevented: true,
          description: 'Unconscious: Automatically fail Strength and Dexterity saving throws',
        };
      }
      return noEffect();
  }
}

/**
 * Combine multiple condition effects into a single aggregated effect.
 * PHB 2024: multiple sources of advantage/disadvantage cancel each other
 * (you either have advantage, disadvantage, or neither — they don't stack).
 */
export function combineConditionEffects(effects: ConditionEffect[]): ConditionEffect {
  let rollModifier = 0;
  let hasAdvantage = false;
  let hasDisadvantage = false;
  let prevented = false;
  const descriptions: string[] = [];

  for (const e of effects) {
    rollModifier += e.rollModifier;
    hasAdvantage = hasAdvantage || e.hasAdvantage;
    hasDisadvantage = hasDisadvantage || e.hasDisadvantage;
    prevented = prevented || e.prevented;
    if (e.description !== 'No effect on this roll') {
      descriptions.push(e.description);
    }
  }

  return {
    rollModifier,
    hasAdvantage,
    hasDisadvantage,
    prevented,
    description: descriptions.join('; ') || 'No effect',
  };
}

// ─── Exhaustion helpers ───────────────────────────────────────────────────────

/** How much speed is reduced per level of exhaustion (2024). */
export const EXHAUSTION_SPEED_PENALTY_PER_LEVEL = 5;

/**
 * Calculate the speed penalty for the given exhaustion level.
 */
export function exhaustionSpeedPenalty(level: number): number {
  if (level <= 0) return 0;
  if (level >= 6) return Infinity; // dead
  return level * EXHAUSTION_SPEED_PENALTY_PER_LEVEL;
}

/**
 * Calculate the d20 Test penalty for the given exhaustion level.
 */
export function exhaustionD20Penalty(level: number): number {
  if (level <= 0) return 0;
  if (level >= 6) return -Infinity; // dead
  return -2 * level;
}

/**
 * Return true if the exhaustion level is lethal (≥ 6).
 */
export function isExhaustionLethal(level: number): boolean {
  return level >= 6;
}
