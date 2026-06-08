import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PlayerInfo {
  id: string;
  name: string;
  colour: string;
  characterName?: string;
  ready?: boolean;
}

export interface SessionState {
  sessionId: string | null;
  sessionCode: string | null;
  isDM: boolean;
  player: PlayerInfo | null;
  connectedPlayers: PlayerInfo[];
  activeTool: 'select' | 'move' | 'measure' | 'ping' | 'fog-reveal' | 'fog-hide';
  selectedTokenId: string | null;

  // Actions
  setSession: (sessionId: string, sessionCode: string) => void;
  setIsDM: (isDM: boolean) => void;
  setPlayer: (player: PlayerInfo) => void;
  setConnectedPlayers: (players: PlayerInfo[]) => void;
  addPlayer: (player: PlayerInfo) => void;
  removePlayer: (playerId: string) => void;
  setActiveTool: (tool: SessionState['activeTool']) => void;
  setSelectedTokenId: (id: string | null) => void;
  setReady: (playerId: string, ready: boolean) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessionId: null,
      sessionCode: null,
      isDM: false,
      player: null,
      connectedPlayers: [],
      activeTool: 'select',
      selectedTokenId: null,

      setSession: (sessionId, sessionCode) => set({ sessionId, sessionCode }),
      setIsDM: (isDM) => set({ isDM }),
      setPlayer: (player) => set({ player }),
      setConnectedPlayers: (connectedPlayers) => set({ connectedPlayers }),
      addPlayer: (player) =>
        set((state) => ({
          connectedPlayers: [...state.connectedPlayers.filter((p) => p.id !== player.id), player],
        })),
      removePlayer: (playerId) =>
        set((state) => ({
          connectedPlayers: state.connectedPlayers.filter((p) => p.id !== playerId),
        })),
      setActiveTool: (activeTool) => set({ activeTool }),
      setSelectedTokenId: (selectedTokenId) => set({ selectedTokenId }),
      setReady: (playerId, ready) =>
        set((state) => ({
          connectedPlayers: state.connectedPlayers.map((p) =>
            p.id === playerId ? { ...p, ready } : p
          ),
        })),
      clearSession: () =>
        set({
          sessionId: null,
          sessionCode: null,
          isDM: false,
          player: null,
          connectedPlayers: [],
          activeTool: 'select',
          selectedTokenId: null,
        }),
    }),
    {
      name: 'taverntable-session',
      partialize: (state) => ({
        player: state.player,
        isDM: state.isDM,
      }),
    }
  )
);
