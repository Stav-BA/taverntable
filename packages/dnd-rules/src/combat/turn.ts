/**
 * Action Economy — D&D 5e 2024
 *
 * Each turn a creature has:
 *   - 1 Action
 *   - 1 Bonus Action
 *   - 1 Reaction (resets at start of their turn)
 *   - Movement (up to speed)
 *   - Free object interactions
 *
 * 2024 note: Some actions have changed (e.g. Search, Ready, Help are actions).
 */

export type ActionType = 'action' | 'bonusAction' | 'reaction' | 'freeAction';

export interface TurnResources {
  action: boolean;
  bonusAction: boolean;
  reaction: boolean;
  /** Remaining movement in feet */
  movementRemaining: number;
  /** Speed in feet (used to reset movement) */
  speed: number;
}

/**
 * Create a fresh set of turn resources for a creature.
 */
export function createTurnResources(speed: number): TurnResources {
  return {
    action: true,
    bonusAction: true,
    reaction: true,
    movementRemaining: speed,
    speed,
  };
}

/**
 * Spend an action. Throws if the action is already spent.
 */
export function spendAction(
  resources: TurnResources,
  type: ActionType,
  movementCost = 0,
): TurnResources {
  const updated = { ...resources };

  switch (type) {
    case 'action':
      if (!updated.action) throw new Error('Action already spent this turn');
      updated.action = false;
      break;
    case 'bonusAction':
      if (!updated.bonusAction) throw new Error('Bonus action already spent this turn');
      updated.bonusAction = false;
      break;
    case 'reaction':
      if (!updated.reaction) throw new Error('Reaction already spent this turn');
      updated.reaction = false;
      break;
    case 'freeAction':
      // Free actions don't deplete a slot
      break;
  }

  if (movementCost > 0) {
    if (movementCost > updated.movementRemaining) {
      throw new Error(
        `Not enough movement: need ${movementCost}ft, have ${updated.movementRemaining}ft`,
      );
    }
    updated.movementRemaining -= movementCost;
  }

  return updated;
}

/**
 * Reset action economy at the start of a creature's turn.
 * Note: reactions are NOT reset here — they reset at the START of the creature's
 * own turn (PHB 2024 p.196).
 */
export function startOfTurn(resources: TurnResources): TurnResources {
  return {
    ...resources,
    action: true,
    bonusAction: true,
    reaction: true,
    movementRemaining: resources.speed,
  };
}

/**
 * Move a creature, spending movement.
 * Difficult terrain costs 2ft of movement per 1ft moved (caller passes 2× distance).
 */
export function move(resources: TurnResources, feet: number): TurnResources {
  if (feet > resources.movementRemaining) {
    throw new Error(
      `Not enough movement: need ${feet}ft, have ${resources.movementRemaining}ft`,
    );
  }
  return { ...resources, movementRemaining: resources.movementRemaining - feet };
}

/** Standard action list (2024 PHB). */
export type StandardAction =
  | 'Attack'
  | 'Cast a Spell'
  | 'Dash'
  | 'Disengage'
  | 'Dodge'
  | 'Help'
  | 'Hide'
  | 'Influence'
  | 'Magic'
  | 'Ready'
  | 'Search'
  | 'Study'
  | 'Utilize';
