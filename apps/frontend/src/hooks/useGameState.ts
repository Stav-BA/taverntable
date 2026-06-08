import { useGameStore } from '@/stores/gameStore';
import { useSessionStore } from '@/stores/sessionStore';

/**
 * Convenience hook — returns the most commonly needed game state slices.
 * Components that need specific slices should subscribe directly to avoid
 * unnecessary re-renders.
 */
export function useGameState() {
  const tokens = useGameStore((s) => s.tokens);
  const currentMap = useGameStore((s) => s.currentMap);
  const fogRevealed = useGameStore((s) => s.fogRevealed);
  const fogEnabled = useGameStore((s) => s.fogEnabled);
  const initiative = useGameStore((s) => s.initiative);
  const currentTurnIndex = useGameStore((s) => s.currentTurnIndex);
  const inCombat = useGameStore((s) => s.inCombat);
  const chatMessages = useGameStore((s) => s.chatMessages);
  const diceHistory = useGameStore((s) => s.diceHistory);

  const sessionId = useSessionStore((s) => s.sessionId);
  const player = useSessionStore((s) => s.player);
  const isDM = useSessionStore((s) => s.isDM);
  const activeTool = useSessionStore((s) => s.activeTool);
  const selectedTokenId = useSessionStore((s) => s.selectedTokenId);
  const connectedPlayers = useSessionStore((s) => s.connectedPlayers);

  const currentTurnCombatant = inCombat ? initiative[currentTurnIndex] : null;
  const isMyTurn =
    inCombat &&
    currentTurnCombatant !== null &&
    (isDM || currentTurnCombatant?.tokenId === player?.id);

  const myToken = tokens.find((t) => t.playerId === player?.id) ?? null;

  return {
    // Game
    tokens,
    currentMap,
    fogRevealed,
    fogEnabled,
    initiative,
    currentTurnIndex,
    currentTurnCombatant,
    inCombat,
    chatMessages,
    diceHistory,
    // Session
    sessionId,
    player,
    isDM,
    activeTool,
    selectedTokenId,
    connectedPlayers,
    // Derived
    isMyTurn,
    myToken,
  };
}
