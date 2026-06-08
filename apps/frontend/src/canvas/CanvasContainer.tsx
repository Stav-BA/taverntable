import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useSessionStore } from '@/stores/sessionStore';
import { socketEmit } from '@/lib/socket';
import { createPixiApp, destroyPixiApp } from './PixiApp';
import { GridSystem } from './GridSystem';
import { TokenManager } from './TokenManager';
import { FogCanvas } from './FogCanvas';
import type { Application } from 'pixi.js';
import type { RevealedArea, MapConfig } from '@/stores/gameStore';

// ── Map SVG file resolution ────────────────────────────────────────────────
function getMapImageUrl(map: MapConfig | null): string | null {
  if (!map) return null;
  const id = map.id ?? '';
  if (id.includes('tavern') || id.includes('inn')) return '/maps/tavern-interior.svg';
  if (id.includes('dungeon') || id.includes('cave')) return '/maps/dungeon-entrance.svg';
  if (id.includes('forest') || id.includes('outdoor')) return '/maps/forest-clearing.svg';
  // If the map has a custom imageUrl, use it
  if ((map as { imageUrl?: string }).imageUrl) return (map as { imageUrl?: string }).imageUrl!;
  return null;
}

// ── Fallback CSS background (used when no SVG is available) ───────────────
function getFallbackStyle(map: MapConfig | null): React.CSSProperties {
  if (!map) return { background: '#1a0f00' };
  const id = map.id ?? '';
  if (id.includes('tavern') || id.includes('inn')) return { background: '#a0692a' };
  if (id.includes('dungeon') || id.includes('cave')) return { background: '#707080' };
  if (id.includes('forest') || id.includes('outdoor')) return { background: '#4a8f2a' };
  return { background: '#5a5060' };
}

export default function CanvasContainer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const gridRef = useRef<GridSystem | null>(null);
  const tokenManagerRef = useRef<TokenManager | null>(null);
  const [ready, setReady] = useState(false);

  const currentMap = useGameStore((s) => s.currentMap);
  const tokens = useGameStore((s) => s.tokens);
  const fogRevealed = useGameStore((s) => s.fogRevealed);
  const fogEnabled = useGameStore((s) => s.fogEnabled);
  const addRevealedArea = useGameStore((s) => s.addRevealedArea);

  const player = useSessionStore((s) => s.player);
  const isDM = useSessionStore((s) => s.isDM);
  const activeTool = useSessionStore((s) => s.activeTool);

  const fogToolActive = isDM && (activeTool === 'fog-reveal' || activeTool === 'fog-hide');

  // ── Initialise PixiJS (grid + tokens only — map is CSS, fog is Canvas2D) ──
  useEffect(() => {
    if (!canvasRef.current) return;
    let mounted = true;

    const init = async () => {
      const app = await createPixiApp(canvasRef.current!);
      if (!mounted) return;

      appRef.current = app;
      app.stage.eventMode = 'static';

      const grid = new GridSystem(app);
      grid.attachToStage(0);
      gridRef.current = grid;

      const tokenManager = new TokenManager(
        app,
        (tokenId, x, y) => {
          useGameStore.getState().updateToken(tokenId, { x, y });
          socketEmit.tokenMove(tokenId, x, y);
        },
        (tokenId) => {
          useSessionStore.getState().setSelectedTokenId(tokenId);
        }
      );
      tokenManager.attachToStage(1);
      tokenManagerRef.current = tokenManager;

      setReady(true);
    };

    init();

    return () => {
      mounted = false;
      destroyPixiApp();
      appRef.current = null;
      gridRef.current = null;
      tokenManagerRef.current = null;
      setReady(false);
    };
  }, []);

  // ── Grid redraws when map changes ─────────────────────────────────────────
  useEffect(() => {
    if (!ready || !currentMap || !gridRef.current) return;
    gridRef.current.drawGrid(currentMap);
  }, [ready, currentMap]);

  // ── Token sync ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !currentMap || !tokenManagerRef.current || !player) return;
    tokenManagerRef.current.syncTokens(tokens, currentMap, player.id, isDM);
  }, [ready, tokens, currentMap, player, isDM]);

  // ── Fog reveal handler ────────────────────────────────────────────────────
  const handleReveal = useCallback((area: RevealedArea) => {
    addRevealedArea(area);
    socketEmit.fogReveal(area as unknown as Record<string, unknown>);
  }, [addRevealedArea]);

  const mapImageUrl = getMapImageUrl(currentMap);
  const fallbackStyle = getFallbackStyle(currentMap);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>

      {/* Layer 1: Map background — SVG image if available, else CSS fallback */}
      <div style={{
        position: 'absolute',
        inset: 0,
        ...fallbackStyle,
        transition: 'background 0.4s ease',
      }}>
        {mapImageUrl && (
          <img
            src={mapImageUrl}
            alt="battle map"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>

      {/* Layer 2: PixiJS canvas — transparent bg, renders grid + tokens */}
      <canvas
        ref={canvasRef}
        id="pixi-canvas"
        style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%' }}
      />

      {/* Layer 3: Fog of war — Canvas2D overlay with evenodd holes */}
      <FogCanvas
        areas={fogRevealed}
        isDM={isDM}
        fogEnabled={fogEnabled}
        fogToolActive={fogToolActive}
        onReveal={handleReveal}
      />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: '#0a0a0a', zIndex: 10 }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full border-4 border-gold animate-spin"
              style={{ borderTopColor: 'transparent' }} />
            <p className="font-cinzel text-gold text-sm tracking-wider">Loading Map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
