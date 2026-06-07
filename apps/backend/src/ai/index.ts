/**
 * index.ts
 * Barrel export for all AI DM services and types.
 */

// Services
export { DMService } from './dmService';
export { MemoryManager } from './memoryManager';

// Prompt builders
export {
  buildSystemPrompt,
  buildNarrationPrompt,
  buildCombatNarrationPrompt,
} from './dmPrompt';

// One-shot generators
export { generateNPC, generateLocation, generateHook, generateTrap } from './generators';

// Types — campaign context
export type {
  CampaignContext,
  PlayerContext,
  NPCRelationship,
  WorldEvent,
  EncounterContext,
  CombatEvent,
} from './dmPrompt';

// Types — memory
export type {
  CampaignMemory,
  AIMessage,
  WorldState,
  Quest,
  QuestObjective,
  NPCState,
} from './memoryManager';

// Types — generators
export type {
  GeneratedNPC,
  GeneratedLocation,
  AdventureHook,
  GeneratedTrap,
} from './generators';
