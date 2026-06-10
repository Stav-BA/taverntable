import { redis } from './client';

const SESSION_TTL = 60 * 60 * 24; // 24 hours

export interface Token {
  id: string;
  x: number;
  y: number;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  colour: string;
  isNpc: boolean;
  isPlayer?: boolean;
  playerId?: string;
  conditions?: string[];
  isVisible?: boolean;
  imageUrl?: string;
}

export interface RevealedArea {
  id: string;
  type: 'circle' | 'rect' | 'polygon';
  cx?: number;
  cy?: number;
  radius?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points?: Array<{ x: number; y: number }>;
}

export interface InitiativeEntry {
  playerId: string;
  name: string;
  roll: number;
  isActive: boolean;
}

export interface ChatEntry {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
  isSecret?: boolean;
}

export interface GameState {
  sessionId: string;
  tokens: Token[];
  fog: { revealed: RevealedArea[] };
  initiative: InitiativeEntry[];
  currentTurn: number;
  chatLog: ChatEntry[];
  mapId: string | null;
}

function stateKey(sessionId: string): string {
  return `game:state:${sessionId}`;
}

export async function getGameState(sessionId: string): Promise<GameState | null> {
  const raw = await redis.get(stateKey(sessionId));
  if (!raw) return null;
  return JSON.parse(raw) as GameState;
}

export async function setGameState(state: GameState): Promise<void> {
  await redis.set(stateKey(state.sessionId), JSON.stringify(state), 'EX', SESSION_TTL);
}

export async function initGameState(sessionId: string): Promise<GameState> {
  const state: GameState = {
    sessionId,
    tokens: [],
    fog: { revealed: [] },
    initiative: [],
    currentTurn: 0,
    chatLog: [],
    mapId: null,
  };
  await setGameState(state);
  return state;
}

export async function getOrInitGameState(sessionId: string): Promise<GameState> {
  return (await getGameState(sessionId)) ?? (await initGameState(sessionId));
}

// ── Tokens ───────────────────────────────────────────────────────────────────

export async function addToken(sessionId: string, token: Token): Promise<GameState | null> {
  const state = await getOrInitGameState(sessionId);
  // Remove any existing token with the same id
  state.tokens = state.tokens.filter((t) => t.id !== token.id);
  state.tokens.push(token);
  await setGameState(state);
  return state;
}

export async function updateToken(
  sessionId: string,
  tokenId: string,
  x: number,
  y: number,
): Promise<GameState | null> {
  const state = await getGameState(sessionId);
  if (!state) return null;
  const token = state.tokens.find((t) => t.id === tokenId);
  if (token) {
    token.x = x;
    token.y = y;
  }
  await setGameState(state);
  return state;
}

export async function removeToken(sessionId: string, tokenId: string): Promise<GameState | null> {
  const state = await getGameState(sessionId);
  if (!state) return null;
  state.tokens = state.tokens.filter((t) => t.id !== tokenId);
  await setGameState(state);
  return state;
}

// ── Fog ──────────────────────────────────────────────────────────────────────

export async function revealFog(sessionId: string, area: RevealedArea): Promise<GameState | null> {
  const state = await getOrInitGameState(sessionId);
  state.fog.revealed.push(area);
  // Cap at 500 areas to prevent unbounded growth
  if (state.fog.revealed.length > 500) {
    state.fog.revealed = state.fog.revealed.slice(-500);
  }
  await setGameState(state);
  return state;
}

// ── Map ───────────────────────────────────────────────────────────────────────

export async function setGameMap(sessionId: string, mapId: string): Promise<GameState | null> {
  const state = await getOrInitGameState(sessionId);
  state.mapId = mapId;
  await setGameState(state);
  return state;
}

// ── Initiative ────────────────────────────────────────────────────────────────

export async function setInitiative(
  sessionId: string,
  entries: InitiativeEntry[],
): Promise<GameState | null> {
  const state = await getOrInitGameState(sessionId);
  state.initiative = entries;
  state.currentTurn = 0;
  await setGameState(state);
  return state;
}

export async function advanceTurn(sessionId: string): Promise<GameState | null> {
  const state = await getGameState(sessionId);
  if (!state) return null;
  if (state.initiative.length === 0) return state;

  if (state.initiative[state.currentTurn]) {
    state.initiative[state.currentTurn].isActive = false;
  }
  state.currentTurn = (state.currentTurn + 1) % state.initiative.length;
  if (state.initiative[state.currentTurn]) {
    state.initiative[state.currentTurn].isActive = true;
  }

  await setGameState(state);
  return state;
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export async function appendChat(
  sessionId: string,
  entry: ChatEntry,
): Promise<GameState | null> {
  const state = await getGameState(sessionId);
  if (!state) return null;
  state.chatLog.push(entry);
  if (state.chatLog.length > 100) {
    state.chatLog = state.chatLog.slice(-100);
  }
  await setGameState(state);
  return state;
}

export async function deleteGameState(sessionId: string): Promise<void> {
  await redis.del(stateKey(sessionId));
}
