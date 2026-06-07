/**
 * Weapon Mastery Properties — D&D 5e 2024
 *
 * All 8 mastery properties:
 *   Cleave  – hit with a melee, attack another creature nearby
 *   Graze   – miss deals Str/Dex modifier damage
 *   Nick    – Light weapon bonus attack uses full Bonus Action
 *   Push    – push target up to 10 ft on hit
 *   Sap     – impose disadvantage on target's next attack
 *   Slow    – reduce target speed by 10 ft until next turn
 *   Topple  – on hit, DC 8 + prof + ability Con save or fall Prone
 *   Vex     – gain advantage on next attack roll vs. same target
 */

import type { AttackResult } from './attack.js';

export type WeaponMastery =
  | 'cleave'
  | 'graze'
  | 'nick'
  | 'push'
  | 'sap'
  | 'slow'
  | 'topple'
  | 'vex';

export interface CombatTarget {
  /** Target's current HP */
  currentHP: number;
  /** Target's maximum HP */
  maxHP: number;
  /** Target's AC */
  ac: number;
  /** Target's Constitution modifier (for Topple save) */
  conMod: number;
  /** Current speed in feet */
  speed: number;
  /** Whether the target is currently prone */
  isProne: boolean;
  /** Whether the target has disadvantage on their next attack (from Sap) */
  hasSapDisadvantage: boolean;
}

export interface MasteryEffect {
  mastery: WeaponMastery;
  /** Whether the mastery property triggered */
  triggered: boolean;
  /** Description of what happened */
  description: string;
  /** Mutations to apply to the target */
  targetMutations: Partial<CombatTarget>;
  /** Extra damage dealt by Graze (0 for all other properties) */
  grazeDamage: number;
  /** Whether Cleave allows an additional attack roll */
  cleaveAttackAllowed: boolean;
  /** Whether the attacker gains advantage on their next attack vs. this target (Vex) */
  vexAdvantage: boolean;
}

/**
 * Apply a weapon mastery property after an attack.
 *
 * @param mastery      – the mastery property being applied
 * @param attack       – the attack result
 * @param attacker     – attacker's relevant ability modifier (Str or Dex)
 * @param target       – the target's current state
 * @param toppleSaveRoll – pre-rolled d20 for the Topple Con save (optional; passed for determinism)
 * @param proficiencyBonus – attacker's proficiency bonus (for Topple DC)
 */
export function applyWeaponMastery(
  mastery: WeaponMastery,
  attack: AttackResult,
  attackerAbilityMod: number,
  proficiencyBonus: number,
  target: CombatTarget,
  toppleSaveRoll?: number,
): MasteryEffect {
  const hit = attack.hits === true;
  const miss = attack.hits === false;

  switch (mastery) {
    // ── Cleave ────────────────────────────────────────────────────────────
    case 'cleave': {
      // On a hit with a melee weapon, you can make an attack vs another creature
      // within 5 ft. No bonus action needed; no additional damage modifiers.
      if (hit) {
        return {
          mastery,
          triggered: true,
          description: 'Cleave: May make an attack roll against another creature within 5 ft.',
          targetMutations: {},
          grazeDamage: 0,
          cleaveAttackAllowed: true,
          vexAdvantage: false,
        };
      }
      return notTriggered(mastery, 'Cleave requires a hit');
    }

    // ── Graze ─────────────────────────────────────────────────────────────
    case 'graze': {
      // On a miss, deal damage equal to the ability modifier used for the attack.
      if (miss) {
        const dmg = Math.max(0, attackerAbilityMod);
        return {
          mastery,
          triggered: true,
          description: `Graze: Miss still deals ${dmg} damage (ability modifier).`,
          targetMutations: { currentHP: Math.max(0, target.currentHP - dmg) },
          grazeDamage: dmg,
          cleaveAttackAllowed: false,
          vexAdvantage: false,
        };
      }
      return notTriggered(mastery, 'Graze only triggers on a miss');
    }

    // ── Nick ──────────────────────────────────────────────────────────────
    case 'nick': {
      // The extra attack from two-weapon fighting with a Nick weapon doesn't
      // cost a bonus action. Mechanically this is a flag for the VTT to handle.
      if (hit) {
        return {
          mastery,
          triggered: true,
          description: 'Nick: Extra attack with this weapon does not require a Bonus Action.',
          targetMutations: {},
          grazeDamage: 0,
          cleaveAttackAllowed: false,
          vexAdvantage: false,
        };
      }
      return notTriggered(mastery, 'Nick: weapon did not hit');
    }

    // ── Push ──────────────────────────────────────────────────────────────
    case 'push': {
      if (hit) {
        return {
          mastery,
          triggered: true,
          description: 'Push: Target is pushed up to 10 ft away (Huge or smaller creatures).',
          targetMutations: {},
          grazeDamage: 0,
          cleaveAttackAllowed: false,
          vexAdvantage: false,
        };
      }
      return notTriggered(mastery, 'Push requires a hit');
    }

    // ── Sap ───────────────────────────────────────────────────────────────
    case 'sap': {
      if (hit) {
        return {
          mastery,
          triggered: true,
          description: 'Sap: Target has Disadvantage on their next attack roll.',
          targetMutations: { hasSapDisadvantage: true },
          grazeDamage: 0,
          cleaveAttackAllowed: false,
          vexAdvantage: false,
        };
      }
      return notTriggered(mastery, 'Sap requires a hit');
    }

    // ── Slow ──────────────────────────────────────────────────────────────
    case 'slow': {
      if (hit) {
        const newSpeed = Math.max(0, target.speed - 10);
        return {
          mastery,
          triggered: true,
          description: `Slow: Target's speed reduced by 10 ft until the start of your next turn (now ${newSpeed} ft).`,
          targetMutations: { speed: newSpeed },
          grazeDamage: 0,
          cleaveAttackAllowed: false,
          vexAdvantage: false,
        };
      }
      return notTriggered(mastery, 'Slow requires a hit');
    }

    // ── Topple ────────────────────────────────────────────────────────────
    case 'topple': {
      if (hit) {
        // DC = 8 + proficiency + ability modifier used for attack
        const dc = 8 + proficiencyBonus + attackerAbilityMod;
        const saveTotal = (toppleSaveRoll ?? 10) + target.conMod;
        const saved = saveTotal >= dc;

        if (saved) {
          return {
            mastery,
            triggered: true,
            description: `Topple: Target passed Con save (DC ${dc}, rolled ${saveTotal}). Not prone.`,
            targetMutations: {},
            grazeDamage: 0,
            cleaveAttackAllowed: false,
            vexAdvantage: false,
          };
        }

        return {
          mastery,
          triggered: true,
          description: `Topple: Target failed Con save (DC ${dc}, rolled ${saveTotal}). Target is now Prone.`,
          targetMutations: { isProne: true },
          grazeDamage: 0,
          cleaveAttackAllowed: false,
          vexAdvantage: false,
        };
      }
      return notTriggered(mastery, 'Topple requires a hit');
    }

    // ── Vex ───────────────────────────────────────────────────────────────
    case 'vex': {
      if (hit) {
        return {
          mastery,
          triggered: true,
          description: 'Vex: Attacker has Advantage on their next attack roll against this target.',
          targetMutations: {},
          grazeDamage: 0,
          cleaveAttackAllowed: false,
          vexAdvantage: true,
        };
      }
      return notTriggered(mastery, 'Vex requires a hit');
    }
  }
}

function notTriggered(mastery: WeaponMastery, reason: string): MasteryEffect {
  return {
    mastery,
    triggered: false,
    description: reason,
    targetMutations: {},
    grazeDamage: 0,
    cleaveAttackAllowed: false,
    vexAdvantage: false,
  };
}

/** All valid weapon mastery names. */
export const ALL_WEAPON_MASTERIES: WeaponMastery[] = [
  'cleave',
  'graze',
  'nick',
  'push',
  'sap',
  'slow',
  'topple',
  'vex',
];
