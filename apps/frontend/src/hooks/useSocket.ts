import { useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useGameStore } from '@/stores/gameStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useAudioStore } from '@/stores/audioStore';
import { useCharacterStore } from '@/stores/characterStore';
import { getAppropriateMonsters } from '@/lib/monsters';
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

    // ── Named handlers ────────────────────────────────────────────────────────

    const onConnect = () => {
      console.log('[Socket] Connected:', socket.id, '| sessionId:', sessionId, '| isDM:', isDM, '| player:', player.name);
      socket.emit('session:join', {
        sessionId,
        playerId: player.id,
        playerName: player.name,
        isDM,
        colour: player.colour,
      });
    };

    const onDisconnect = (reason: string) => {
      console.warn('[Socket] Disconnected:', reason);
    };

    const onConnectError = (err: Error) => {
      console.error('[Socket] Connection error:', err.message);
    };

    const onGameState = (state: {
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
    };

    // Token events
    const onTokenMoved = ({ tokenId, x, y }: { tokenId: string; x: number; y: number }) => {
      updateToken(tokenId, { x, y });
    };

    const onTokenUpdated = ({ tokenId, updates }: { tokenId: string; updates: Partial<Token> }) => {
      updateToken(tokenId, updates);
    };

    const onTokenAdded = (token: Token) => {
      addToken(token);
    };

    const onTokenRemoved = ({ tokenId }: { tokenId: string }) => {
      removeToken(tokenId);
    };

    // Fog events
    const onFogRevealed = (area: RevealedArea) => {
      addRevealedArea(area);
    };

    const onFogReset = (areas: RevealedArea[]) => {
      setFogRevealed(areas);
    };

    const onFogToggled = ({ enabled }: { enabled: boolean }) => {
      setFogEnabled(enabled);
    };

    // Initiative / combat
    const onInitiativeSet = (combatants: Combatant[]) => {
      setInitiative(combatants);
    };

    const onInitiativeUpdated = ({ id, updates }: { id: string; updates: Partial<Combatant> }) => {
      updateCombatant(id, updates);
    };

    const onInitiativeNext = () => {
      nextTurn();
    };

    const onCombatStarted = () => {
      setInCombat(true);
      addChatMessage({
        id: `sys-${Date.now()}`,
        type: 'system',
        text: '⚔️ Combat has begun! Roll for initiative!',
        timestamp: Date.now(),
      });
    };

    const onCombatEnded = () => {
      setInCombat(false);
      addChatMessage({
        id: `sys-${Date.now()}`,
        type: 'system',
        text: '🏳️ Combat has ended. Peace restored... for now.',
        timestamp: Date.now(),
      });
    };

    // Map change
    const onMapChanged = (mapData: MapConfig | { id: string }) => {
      const { availableMaps } = useGameStore.getState();
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
    };

    // Chat
    const onChatMessage = (msg: ChatMessage) => {
      addChatMessage(msg);
    };

    // Dice
    const onDiceResult = (result: DiceRollResult) => {
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
    };

    // Audio (DM-controlled)
    const onAudioPlay = ({ trackId }: { trackId: string }) => {
      const track = tracks.find((t: AudioTrack) => t.id === trackId);
      if (track) setTrack(track);
    };

    const onAudioPause = () => {
      pause();
    };

    const onAudioVolume = ({ volume }: { volume: number }) => {
      setVolume(volume);
    };

    // Player presence
    const onPlayerJoined = (playerInfo: PlayerInfo) => {
      addPlayer(playerInfo);
      addChatMessage({
        id: `sys-${Date.now()}`,
        type: 'system',
        text: `${playerInfo.name} has joined the session.`,
        timestamp: Date.now(),
      });
    };

    const onPlayerLeft = ({ playerId, playerName }: { playerId: string; playerName: string }) => {
      removePlayer(playerId);
      addChatMessage({
        id: `sys-${Date.now()}`,
        type: 'system',
        text: `${playerName} has left the session.`,
        timestamp: Date.now(),
      });
    };

    const onPlayersList = (players: PlayerInfo[]) => {
      console.log('[Socket] players:list received:', players);
      setConnectedPlayers(players);
    };

    // Adventure started overlay
    const onAdventureStarted = ({ campaignName, lore }: { campaignName: string; lore: string }) => {
      setAdventureStarted(true, { campaignName, lore });
    };

    // Rest events
    const onRestTaken = ({ type }: { type: 'short' | 'long' }) => {
      addChatMessage({
        id: `sys-rest-${Date.now()}`,
        type: 'system',
        text: type === 'short'
          ? 'Short Rest taken — spend Hit Dice to recover HP.'
          : 'Long Rest complete — all HP, spell slots, and Hit Dice restored.',
        timestamp: Date.now(),
      });
    };

    // ── Register all listeners ────────────────────────────────────────────────

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('game:state', onGameState);
    socket.on('token:moved', onTokenMoved);
    socket.on('token:updated', onTokenUpdated);
    socket.on('token:added', onTokenAdded);
    socket.on('token:removed', onTokenRemoved);
    socket.on('fog:revealed', onFogRevealed);
    socket.on('fog:reset', onFogReset);
    socket.on('fog:toggled', onFogToggled);
    socket.on('initiative:set', onInitiativeSet);
    socket.on('initiative:updated', onInitiativeUpdated);
    socket.on('initiative:next', onInitiativeNext);
    socket.on('combat:started', onCombatStarted);
    socket.on('combat:ended', onCombatEnded);
    socket.on('map:changed', onMapChanged);
    socket.on('chat:message', onChatMessage);
    socket.on('dice:result', onDiceResult);
    socket.on('audio:play', onAudioPlay);
    socket.on('audio:pause', onAudioPause);
    socket.on('audio:volume', onAudioVolume);
    socket.on('player:joined', onPlayerJoined);
    socket.on('player:left', onPlayerLeft);
    socket.on('players:list', onPlayersList);
    socket.on('adventure:started', onAdventureStarted);
    socket.on('rest:taken', onRestTaken);

    // ── Random encounter auto-spawn ─────────────────────────────────────────
    const onRandomEncounterSpawn = ({ x, y, biome, partyLevel }: { x: number; y: number; biome: string; partyLevel: number }) => {
      const pool = getAppropriateMonsters(partyLevel, biome);
      if (pool.length === 0) return;
      const monster = pool[Math.floor(Math.random() * pool.length)];
      const tokenId = `monster-${monster.id}-${Date.now()}`;
      socket.emit('monster:spawn', {
        sessionId,
        monster: { id: monster.id, tokenId, name: monster.name, emoji: monster.emoji, imageUrl: `emoji:${monster.emoji}`, hp: monster.hp, maxHp: monster.hp, ac: monster.ac, speed: monster.speed, cr: monster.cr, colour: monster.colour, x, y },
      });
      addChatMessage({ id: `sys-encounter-${Date.now()}`, type: 'system', text: `⚡ Random encounter! A ${monster.name} appears! (CR ${monster.cr})`, timestamp: Date.now() });
    };
    socket.on('random:encounter:spawn', onRandomEncounterSpawn);

    // ── Combat attack sync ──────────────────────────────────────────────────
    const onCombatAttackResult = ({ targetId, newHp, conditions }: { targetId: string; newHp: number; conditions: string[] }) => {
      useGameStore.getState().updateCombatant(targetId, { hp: newHp, conditions: conditions as Combatant['conditions'] });
    };
    socket.on('combat:attack:result', onCombatAttackResult);

    // ── XP award ────────────────────────────────────────────────────────────
    const onXpAwarded = ({ playerId, amount }: { playerId: string; amount: number }) => {
      const didLevelUp = useCharacterStore.getState().awardXP(playerId, amount);
      if (didLevelUp) {
        addChatMessage({ id: `lvlup-${Date.now()}`, type: 'system', text: `🎉 Level up! Your character reached a new level!`, timestamp: Date.now() });
      }
    };
    socket.on('xp:awarded', onXpAwarded);

    // ── Character sheet sync ─────────────────────────────────────────────────
    const onCharacterUpdated = ({ playerId, updates }: { playerId: string; updates: Record<string, unknown> }) => {
      const { updateSheet } = useCharacterStore.getState();
      updateSheet(playerId, updates as Parameters<typeof updateSheet>[1]);
    };
    socket.on('character:updated', onCharacterUpdated);

    // ── Shop ─────────────────────────────────────────────────────────────────
    const onShopOpened = ({ shopId }: { shopId: string }) => {
      (window as any).__activeShopId = shopId;
    };
    socket.on('shop:opened', onShopOpened);

    const onShopClosed = () => {
      (window as any).__activeShopId = null;
    };
    socket.on('shop:closed', onShopClosed);

    // ── Loot ─────────────────────────────────────────────────────────────────
    const onLootDropped = ({ lootId, items, gold, label }: { lootId: string; items: Array<{ name: string; type: string; quantity: number; costGp?: number }>; gold: number; label: string }) => {
      (window as any).__activeLoot = { lootId, items, gold, label };
    };
    socket.on('loot:dropped', onLootDropped);

    const onLootTaken = (_data: { lootId: string; playerId: string; playerName: string; itemName: string }) => {
      // chat:message for loot takes is broadcast by backend
    };
    socket.on('loot:taken', onLootTaken);

    return () => {
      hasConnected.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('game:state', onGameState);
      socket.off('token:moved', onTokenMoved);
      socket.off('token:updated', onTokenUpdated);
      socket.off('token:added', onTokenAdded);
      socket.off('token:removed', onTokenRemoved);
      socket.off('fog:revealed', onFogRevealed);
      socket.off('fog:reset', onFogReset);
      socket.off('fog:toggled', onFogToggled);
      socket.off('initiative:set', onInitiativeSet);
      socket.off('initiative:updated', onInitiativeUpdated);
      socket.off('initiative:next', onInitiativeNext);
      socket.off('combat:started', onCombatStarted);
      socket.off('combat:ended', onCombatEnded);
      socket.off('map:changed', onMapChanged);
      socket.off('chat:message', onChatMessage);
      socket.off('dice:result', onDiceResult);
      socket.off('audio:play', onAudioPlay);
      socket.off('audio:pause', onAudioPause);
      socket.off('audio:volume', onAudioVolume);
      socket.off('player:joined', onPlayerJoined);
      socket.off('player:left', onPlayerLeft);
      socket.off('players:list', onPlayersList);
      socket.off('adventure:started', onAdventureStarted);
      socket.off('rest:taken', onRestTaken);
      socket.off('random:encounter:spawn', onRandomEncounterSpawn);
      socket.off('combat:attack:result', onCombatAttackResult);
      socket.off('xp:awarded', onXpAwarded);
      socket.off('character:updated', onCharacterUpdated);
      socket.off('shop:opened', onShopOpened);
      socket.off('shop:closed', onShopClosed);
      socket.off('loot:dropped', onLootDropped);
      socket.off('loot:taken', onLootTaken);
      disconnectSocket();
    };
  }, [sessionId, player?.id, isDM]);

  return getSocket();
}
