import { useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useGameStore } from '@/stores/gameStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useAudioStore } from '@/stores/audioStore';
import type { Token, Combatant, RevealedArea, ChatMessage, DiceRollResult, MapConfig } from '@/stores/gameStore';
import type { PlayerInfo } from '@/stores/sessionStore';
import type { AudioTrack } from '@/stores/audioStore';


export function useSocket() {
  const hasConnected = useRef(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sessionId = useSessionStore((s) => s.sessionId);
  const player = useSessionStore((s) => s.player);
  const isDM = useSessionStore((s) => s.isDM);
  const setConnectedPlayers = useSessionStore((s) => s.setConnectedPlayers);
  const addPlayer = useSessionStore((s) => s.addPlayer);
  const removePlayer = useSessionStore((s) => s.removePlayer);

  const {
    setTokens,
    updateToken,
    addToken,
    removeToken,
    setFogRevealed,
    addRevealedArea,
    setFogEnabled,
    setInitiative,
    updateCombatant,
    nextTurn,
    setInCombat,
    setCurrentMap,
    addChatMessage,
    addDiceRoll,
    applyServerState,
    setAdventureStarted,
  } = useGameStore.getState();

  const { setTrack, pause, setVolume } = useAudioStore.getState();
  const tracks = useAudioStore.getState().tracks;

  useEffect(() => {
    if (!sessionId || !player) return;
    if (hasConnected.current) return;
    hasConnected.current = true;

    const socket = connectSocket(sessionId, player.id, isDM);

    // Connection lifecycle
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id, '| sessionId:', sessionId, '| isDM:', isDM, '| player:', player.name);
      socket.emit('session:join', {
        sessionId,
        playerId: player.id,
        playerName: player.name,
        isDM,
        colour: player.colour,
      });
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      // Reconnect handled automatically by socket.io
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    // Full game state sync on join
    socket.on(
      'game:state',
      (state: {
        tokens?: Token[];
        fogRevealed?: RevealedArea[];
        fogEnabled?: boolean;
        initiative?: Combatant[];
        currentTurnIndex?: number;
        inCombat?: boolean;
        currentMap?: MapConfig | null;
        mapId?: string | null;
        connectedPlayers?: PlayerInfo[];
      }) => {
        if (state.tokens) setTokens(state.tokens);
        if (state.fogRevealed) setFogRevealed(state.fogRevealed);
        if (state.fogEnabled !== undefined) setFogEnabled(state.fogEnabled);
        if (state.initiative) setInitiative(state.initiative);
        if (state.inCombat !== undefined) setInCombat(state.inCombat);

        // Resolve map: prefer full MapConfig, fall back to resolving mapId from availableMaps
        if (state.currentMap) {
          setCurrentMap(state.currentMap);
        } else if (state.mapId) {
          const { availableMaps } = useGameStore.getState();
          const resolved = availableMaps.find((m) => m.id === state.mapId);
          if (resolved) setCurrentMap(resolved);
        }

        if (state.connectedPlayers) setConnectedPlayers(state.connectedPlayers);
        applyServerState({
          currentTurnIndex: state.currentTurnIndex ?? 0,
        });
      }
    );

    // Token events
    socket.on('token:moved', ({ tokenId, x, y }: { tokenId: string; x: number; y: number }) => {
      updateToken(tokenId, { x, y });
    });

    socket.on(
      'token:updated',
      ({ tokenId, updates }: { tokenId: string; updates: Partial<Token> }) => {
        updateToken(tokenId, updates);
      }
    );

    socket.on('token:added', (token: Token) => {
      addToken(token);
    });

    socket.on('token:removed', ({ tokenId }: { tokenId: string }) => {
      removeToken(tokenId);
    });

    // Fog events
    socket.on('fog:revealed', (area: RevealedArea) => {
      addRevealedArea(area);
    });

    socket.on('fog:reset', (areas: RevealedArea[]) => {
      setFogRevealed(areas);
    });

    socket.on('fog:toggled', ({ enabled }: { enabled: boolean }) => {
      setFogEnabled(enabled);
    });

    // Initiative / combat
    socket.on('initiative:set', (combatants: Combatant[]) => {
      setInitiative(combatants);
    });

    socket.on(
      'initiative:updated',
      ({ id, updates }: { id: string; updates: Partial<Combatant> }) => {
        updateCombatant(id, updates);
      }
    );

    socket.on('initiative:next', () => {
      nextTurn();
    });

    socket.on('combat:started', () => {
      setInCombat(true);
      addChatMessage({
        id: `sys-${Date.now()}`,
        type: 'system',
        text: '⚔️ Combat has begun! Roll for initiative!',
        timestamp: Date.now(),
      });
    });

    socket.on('combat:ended', () => {
      setInCombat(false);
      addChatMessage({
        id: `sys-${Date.now()}`,
        type: 'system',
        text: '🏳️ Combat has ended. Peace restored... for now.',
        timestamp: Date.now(),
      });
    });

    // Map change
    socket.on('map:changed', (mapData: MapConfig | { id: string }) => {
      const { availableMaps } = useGameStore.getState();
      // Resolve partial { id } or full MapConfig
      const mapConfig: MapConfig | undefined =
        'gridCols' in mapData
          ? (mapData as MapConfig)
          : availableMaps.find((m) => m.id === (mapData as { id: string }).id);

      if (mapConfig) {
        setCurrentMap(mapConfig);
        addChatMessage({
          id: `sys-${Date.now()}`,
          type: 'system',
          text: `The scene changes to: ${mapConfig.name}`,
          timestamp: Date.now(),
        });
      }
    });

    // Chat
    socket.on('chat:message', (msg: ChatMessage) => {
      addChatMessage(msg);
    });

    // Dice
    socket.on('dice:result', (result: DiceRollResult) => {
      addDiceRoll(result);
      addChatMessage({
        id: `roll-${result.id}`,
        type: 'roll',
        playerId: result.playerId,
        playerName: result.playerName,
        text: `rolled ${result.expression}: **${result.total}**`,
        rollResult: result,
        timestamp: result.timestamp,
      });
    });

    // Audio (DM-controlled)
    socket.on('audio:play', ({ trackId }: { trackId: string }) => {
      const track = tracks.find((t: AudioTrack) => t.id === trackId);
      if (track) setTrack(track);
    });

    socket.on('audio:pause', () => {
      pause();
    });

    socket.on('audio:volume', ({ volume }: { volume: number }) => {
      setVolume(volume);
    });

    // Player presence
    socket.on('player:joined', (playerInfo: PlayerInfo) => {
      addPlayer(playerInfo);
      addChatMessage({
        id: `sys-${Date.now()}`,
        type: 'system',
        text: `${playerInfo.name} has joined the session.`,
        timestamp: Date.now(),
      });
    });

    socket.on('player:left', ({ playerId, playerName }: { playerId: string; playerName: string }) => {
      removePlayer(playerId);
      addChatMessage({
        id: `sys-${Date.now()}`,
        type: 'system',
        text: `${playerName} has left the session.`,
        timestamp: Date.now(),
      });
    });

    socket.on('players:list', (players: PlayerInfo[]) => {
      console.log('[Socket] players:list received:', players);
      setConnectedPlayers(players);
    });

    // Adventure started overlay
    socket.on('adventure:started', ({ campaignName, lore }: { campaignName: string; lore: string }) => {
      setAdventureStarted(true, { campaignName, lore });
    });

    // Rest events
    socket.on('rest:taken', ({ type }: { type: 'short' | 'long' }) => {
      addChatMessage({
        id: `sys-rest-${Date.now()}`,
        type: 'system',
        text: type === 'short'
          ? 'Short Rest taken — spend Hit Dice to recover HP.'
          : 'Long Rest complete — all HP, spell slots, and Hit Dice restored.',
        timestamp: Date.now(),
      });
    });

    return () => {
      hasConnected.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('game:state');
      socket.off('token:moved');
      socket.off('token:updated');
      socket.off('token:added');
      socket.off('token:removed');
      socket.off('fog:revealed');
      socket.off('fog:reset');
      socket.off('fog:toggled');
      socket.off('initiative:set');
      socket.off('initiative:updated');
      socket.off('initiative:next');
      socket.off('combat:started');
      socket.off('combat:ended');
      socket.off('map:changed');
      socket.off('chat:message');
      socket.off('dice:result');
      socket.off('audio:play');
      socket.off('audio:pause');
      socket.off('audio:volume');
      socket.off('player:joined');
      socket.off('player:left');
      socket.off('players:list');
      socket.off('adventure:started');
      socket.off('rest:taken');
      disconnectSocket();
    };
  }, [sessionId, player?.id, isDM]);

  return getSocket();
}
