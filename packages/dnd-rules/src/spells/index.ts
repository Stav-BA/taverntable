export {
  getSpellSlots,
  getWarlockPactMagic,
  canCastSpell,
  expendSlot,
  restoreSlots,
  SUPPORTED_CLASSES,
} from './slots.js';
export type {
  SpellSlotTable,
  PactMagicTable,
  SpellcastingType,
  SupportedClass,
} from './slots.js';

export {
  rollConcentrationCheck,
  validateCastLevel,
  upcasting,
  cantripDiceCount,
  isRitualCast,
} from './casting.js';
export type {
  ConcentrationState,
  ConcentrationCheckResult,
  SpellCastOptions,
} from './casting.js';
