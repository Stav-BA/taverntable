export { rollInitiative, sortInitiative } from './initiative.js';
export type { InitiativeResult } from './initiative.js';

export { createTurnResources, spendAction, startOfTurn, move } from './turn.js';
export type { ActionType, TurnResources, StandardAction } from './turn.js';

export { calculateAC, rollAttack, resolveHit, rollDamage } from './attack.js';
export type { ArmorType, AttackResult, DamageResult } from './attack.js';

export {
  applyConditionEffect,
  combineConditionEffects,
  exhaustionSpeedPenalty,
  exhaustionD20Penalty,
  isExhaustionLethal,
  EXHAUSTION_SPEED_PENALTY_PER_LEVEL,
} from './conditions.js';
export type { Condition, RollContext, ConditionEffect } from './conditions.js';

export { applyWeaponMastery, ALL_WEAPON_MASTERIES } from './weaponMastery.js';
export type { WeaponMastery, CombatTarget, MasteryEffect } from './weaponMastery.js';
