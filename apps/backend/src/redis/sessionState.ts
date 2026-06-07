import { redis } from './client';

const SESSION_TTL = 60 * 60 * 24; // 24 hours in seconds

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
  fog: { revealed: number[][] };
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

export async function revealFog(
  sessionId: string,
  polygonPoints: number[][],
): Promise<GameState | null> {
  const state = await getGameState(sessionId);
  if (!state) return null;
  state.fog.revealed.push(...polygonPoints);
  await setGameState(state);
  return state;
}

export async function advanceTurn(sessionId: string): Promise<GameState | null> {
  const state = await getGameState(sessionId);
  if (!state) return null;
  if (state.initiative.length === 0) return state;

  // Mark previous as inactive
  if (state.initiative[state.currentTurn]) {
    state.initiative[state.currentTurn].isActive = false;
  }

  state.currentTurn = (state.currentTurn + 1) % state.initiative.length;

  // Mark new active
  if (state.initiative[state.currentTurn]) {
    state.initiative[state.currentTurn].isActive = true;
  }

  await setGameState(state);
  return state;
}

export async function appendChat(
  sessionId: string,
  entry: ChatEntry,
): Promise<GameState | null> {
  const state = await getGameState(sessionId);
  if (!state) return null;
  state.chatLog.push(entry);
  // Keep last 100 messages
  if (state.chatLog.length > 100) {
    state.chatLog = state.chatLog.slice(-100);
  }
  await setGameState(state);
  return state;
}

export async function deleteGameState(sessionId: string): Promise<void> {
  await redis.del(stateKey(sessionId));
}
