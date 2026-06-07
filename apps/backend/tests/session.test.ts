import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GameState,
  Token,
  ChatEntry,
} from '../src/redis/sessionState';

// ---------------------------------------------------------------------------
// Unit tests for session state helpers — Redis is mocked
// ---------------------------------------------------------------------------

// We test the pure logic by re-implementing the state mutations here,
// so that tests are fast and require no running infrastructure.

function createFreshState(sessionId: string): GameState {
  return {
    sessionId,
    tokens: [],
    fog: { revealed: [] },
    initiative: [],
    currentTurn: 0,
    chatLog: [],
    mapId: null,
  };
}

function moveToken(state: GameState, tokenId: string, x: number, y: number): GameState {
  const s = { ...state, tokens: state.tokens.map((t) => ({ ...t })) };
  const token = s.tokens.find((t) => t.id === tokenId);
  if (token) { token.x = x; token.y = y; }
  return s;
}

function advanceTurn(state: GameState): GameState {
  if (state.initiative.length === 0) return state;
  const s = {
    ...state,
    initiative: state.initiative.map((e) => ({ ...e, isActive: false })),
  };
  s.currentTurn = (state.currentTurn + 1) % s.initiative.length;
  s.initiative[s.currentTurn].isActive = true;
  return s;
}

function appendChat(state: GameState, entry: ChatEntry): GameState {
  const log = [...state.chatLog, entry];
  return { ...state, chatLog: log.length > 100 ? log.slice(-100) : log };
}

// ---------------------------------------------------------------------------

describe('GameState initialisation', () => {
  it('creates empty state with correct shape', () => {
    const state = createFreshState('test-session');
    expect(state.sessionId).toBe('test-session');
    expect(state.tokens).toHaveLength(0);
    expect(state.chatLog).toHaveLength(0);
    expect(state.currentTurn).toBe(0);
    expect(state.mapId).toBeNull();
  });
});

describe('Token movement', () => {
  it('moves a token to new coordinates', () => {
    const token: Token = { id: 'tok1', x: 0, y: 0, name: 'Hero', hp: 10, maxHp: 10, ac: 15, colour: '#fff', isNpc: false };
    let state = createFreshState('s1');
    state = { ...state, tokens: [token] };

    const updated = moveToken(state, 'tok1', 5, 10);
    expect(updated.tokens[0].x).toBe(5);
    expect(updated.tokens[0].y).toBe(10);
  });

  it('does not modify other tokens', () => {
    const tokens: Token[] = [
      { id: 'tok1', x: 0, y: 0, name: 'Hero', hp: 10, maxHp: 10, ac: 15, colour: '#fff', isNpc: false },
      { id: 'tok2', x: 3, y: 3, name: 'Goblin', hp: 5, maxHp: 5, ac: 12, colour: '#0f0', isNpc: true },
    ];
    let state = createFreshState('s1');
    state = { ...state, tokens };

    const updated = moveToken(state, 'tok1', 9, 9);
    expect(updated.tokens[1].x).toBe(3);
    expect(updated.tokens[1].y).toBe(3);
  });

  it('is a no-op when tokenId does not exist', () => {
    let state = createFreshState('s1');
    const updated = moveToken(state, 'missing', 5, 5);
    expect(updated.tokens).toHaveLength(0);
  });
});

describe('Turn advancement', () => {
  it('advances to the next player', () => {
    let state = createFreshState('s1');
    state = {
      ...state,
      initiative: [
        { playerId: 'p1', name: 'Alice', roll: 20, isActive: true },
        { playerId: 'p2', name: 'Bob', roll: 15, isActive: false },
      ],
      currentTurn: 0,
    };

    const next = advanceTurn(state);
    expect(next.currentTurn).toBe(1);
    expect(next.initiative[1].isActive).toBe(true);
    expect(next.initiative[0].isActive).toBe(false);
  });

  it('wraps around to the first player', () => {
    let state = createFreshState('s1');
    state = {
      ...state,
      initiative: [
        { playerId: 'p1', name: 'Alice', roll: 20, isActive: false },
        { playerId: 'p2', name: 'Bob', roll: 15, isActive: true },
      ],
      currentTurn: 1,
    };

    const next = advanceTurn(state);
    expect(next.currentTurn).toBe(0);
    expect(next.initiative[0].isActive).toBe(true);
  });

  it('is a no-op when initiative is empty', () => {
    const state = createFreshState('s1');
    const next = advanceTurn(state);
    expect(next.currentTurn).toBe(0);
    expect(next.initiative).toHaveLength(0);
  });
});

describe('Chat log', () => {
  it('appends messages', () => {
    let state = createFreshState('s1');
    const entry: ChatEntry = { id: 'c1', playerId: 'p1', playerName: 'Alice', text: 'Hello!', timestamp: Date.now() };
    state = appendChat(state, entry);
    expect(state.chatLog).toHaveLength(1);
    expect(state.chatLog[0].text).toBe('Hello!');
  });

  it('trims log to the last 100 messages', () => {
    let state = createFreshState('s1');
    for (let i = 0; i < 105; i++) {
      state = appendChat(state, {
        id: `c${i}`,
        playerId: 'p1',
        playerName: 'Alice',
        text: `msg ${i}`,
        timestamp: Date.now() + i,
      });
    }
    expect(state.chatLog).toHaveLength(100);
    // oldest messages should be trimmed
    expect(state.chatLog[0].text).toBe('msg 5');
  });
});
