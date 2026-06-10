import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type Condition =
  | 'blinded'
  | 'charmed'
  | 'deafened'
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

export interface Token {
  id: string;
  name: string;
  x: number; // grid column
  y: number; // grid row
  colour: string;
  hp: number;
  maxHp: number;
  ac: number;
  imageUrl?: string;
  isPlayer: boolean;
  isNpc?: boolean;
  isChest?: boolean;
  playerId?: string;
  conditions: Condition[];
  isVisible: boolean; // DM toggle for NPC visibility
}

export interface Combatant {
  id: string;
  tokenId: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  colour: string;
  conditions: Condition[];
  isPlayer: boolean;
  // Extended combat fields (2024 rules)
  dexMod: number;
  initiativeRoll: number;
  actionUsed: boolean;
  bonusActionUsed: boolean;
  reactionUsed: boolean;
  movementUsed: number;
  speed: number;
  isEnemy: boolean;
  surprised: boolean;
}

export interface RevealedArea {
  id: string;
  type: 'circle' | 'rect' | 'polygon';
  // circle
  cx?: number;
  cy?: number;
  radius?: number;
  // rect
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // polygon
  points?: Array<{ x: number; y: number }>;
}

export interface MapConfig {
  id: string;
  name: string;
  imageUrl: string;
  gridCols: number;
  gridRows: number;
  gridSizePx: number; // size of one square in source image pixels
  offsetX: number;
  offsetY: number;
}

export interface DiceRollResult {
  id: string;
  playerId: string;
  playerName: string;
  expression: string; // e.g. "2d6+1d4+3"
  rolls: Array<{ die: string; results: number[] }>;
  modifier: number;
  total: number;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  type: 'player' | 'dm' | 'system' | 'roll';
  playerId?: string;
  playerName?: string;
  text: string;
  rollResult?: DiceRollResult;
  timestamp: number;
}

export interface GameState {
  // Map
  currentMap: MapConfig | null;
  availableMaps: MapConfig[];

  // Tokens
  tokens: Token[];

  // Fog of War
  fogRevealed: RevealedArea[];
  fogEnabled: boolean;

  // Combat
  initiative: Combatant[];
  currentTurnIndex: number;
  inCombat: boolean;
  round: number;

  // Adventure started overlay
  adventureStarted: boolean;
  adventurePayload: { campaignName: string; lore: string } | null;

  // Chat
  chatMessages: ChatMessage[];
  diceHistory: DiceRollResult[];

  // Actions
  setCurrentMap: (map: MapConfig) => void;
  setTokens: (tokens: Token[]) => void;
  updateToken: (id: string, updates: Partial<Token>) => void;
  addToken: (token: Token) => void;
  removeToken: (id: string) => void;
  setFogRevealed: (areas: RevealedArea[]) => void;
  addRevealedArea: (area: RevealedArea) => void;
  setFogEnabled: (enabled: boolean) => void;
  setInitiative: (combatants: Combatant[]) => void;
  updateCombatant: (id: string, updates: Partial<Combatant>) => void;
  nextTurn: () => void;
  setInCombat: (inCombat: boolean) => void;
  setRound: (round: number) => void;
  setAdventureStarted: (started: boolean, payload?: { campaignName: string; lore: string }) => void;
  addChatMessage: (msg: ChatMessage) => void;
  addDiceRoll: (roll: DiceRollResult) => void;
  applyServerState: (state: Partial<GameState>) => void;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set) => ({
    currentMap: null,
    availableMaps: [
      {
        id: 'tavern-interior',
        name: 'The Rusty Flagon - Interior',
        imageUrl: '/maps/tavern-interior.jpg',
        gridCols: 20,
        gridRows: 16,
        gridSizePx: 70,
        offsetX: 0,
        offsetY: 0,
      },
      {
        id: 'dungeon-entrance',
        name: 'Dungeon Entrance',
        imageUrl: '/maps/dungeon-entrance.jpg',
        gridCols: 24,
        gridRows: 20,
        gridSizePx: 70,
        offsetX: 0,
        offsetY: 0,
      },
      {
        id: 'forest-clearing',
        name: 'Forest Clearing',
        imageUrl: '/maps/forest-clearing.jpg',
        gridCols: 30,
        gridRows: 24,
        gridSizePx: 70,
        offsetX: 0,
        offsetY: 0,
      },
    ],
    tokens: [],
    fogRevealed: [],
    fogEnabled: false,  // starts OFF — DM enables fog from the toolbar
    initiative: [],
    currentTurnIndex: 0,
    inCombat: false,
    round: 0,
    adventureStarted: false,
    adventurePayload: null,
    chatMessages: [
      {
        id: 'sys-welcome',
        type: 'system',
        text: 'Welcome to TavernTable! The adventure begins...',
        timestamp: Date.now(),
      },
    ],
    diceHistory: [],

    setCurrentMap: (map) => set({ currentMap: map }),
    setTokens: (tokens) => set({ tokens }),
    updateToken: (id, updates) =>
      set((state) => ({
        tokens: state.tokens.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),
    addToken: (token) =>
      set((state) => ({
        tokens: state.tokens.some((t) => t.id === token.id)
          ? state.tokens
          : [...state.tokens, token],
      })),
    removeToken: (id) =>
      set((state) => ({ tokens: state.tokens.filter((t) => t.id !== id) })),
    setFogRevealed: (areas) => set({ fogRevealed: areas }),
    addRevealedArea: (area) =>
      set((state) => ({ fogRevealed: [...state.fogRevealed, area] })),
    setFogEnabled: (fogEnabled) => set({ fogEnabled }),
    setInitiative: (combatants) => set({ initiative: combatants, currentTurnIndex: 0 }),
    updateCombatant: (id, updates) =>
      set((state) => ({
        initiative: state.initiative.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      })),
    nextTurn: () =>
      set((state) => {
        const len = Math.max(state.initiative.length, 1);
        const next = (state.currentTurnIndex + 1) % len;
        const newRound = next === 0 ? state.round + 1 : state.round;
        // Reset reaction for the combatant whose turn is starting
        const updatedInitiative = state.initiative.map((c, i) =>
          i === next ? { ...c, reactionUsed: false } : c
        );
        return { currentTurnIndex: next, round: newRound, initiative: updatedInitiative };
      }),
    setInCombat: (inCombat) => set({ inCombat }),
    setRound: (round) => set({ round }),
    setAdventureStarted: (adventureStarted, payload) =>
      set({ adventureStarted, adventurePayload: payload ?? null }),
    addChatMessage: (msg) =>
      set((state) => ({
        chatMessages: [...state.chatMessages.slice(-199), msg],
      })),
    addDiceRoll: (roll) =>
      set((state) => ({
        diceHistory: [...state.diceHistory.slice(-49), roll],
      })),
    applyServerState: (state) => set(state),
  }))
);
