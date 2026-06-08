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

// ── Map background styles ──────────────────────────────────────────────────
function getMapStyle(map: MapConfig | null): React.CSSProperties {
  if (!map) return { background: '#1a0f00' };

  const id = map.id ?? '';
  const gridPx = map.gridSizePx ?? 70;

  if (id.includes('tavern') || id.includes('inn')) {
    // Warm oak wood planks — horizontal lines every gridSizePx
    return {
      background: '#a0692a',
      backgroundImage: [
        // Alternating plank shades
        `repeating-linear-gradient(
          180deg,
          rgba(0,0,0,0) 0px,
          rgba(0,0,0,0) ${gridPx - 3}px,
          rgba(0,0,0,0.25) ${gridPx - 3}px,
          rgba(0,0,0,0.25) ${gridPx}px
        )`,
        // Subtle grain
        `repeating-linear-gradient(
          92deg,
          rgba(255,255,255,0) 0px,
          rgba(255,255,255,0.03) 4px,
          rgba(255,255,255,0) 8px
        )`,
      ].join(', '),
    };
  }

  if (id.includes('dungeon') || id.includes('cave')) {
    // Gray stone blocks — grid seams
    return {
      background: '#707080',
      backgroundImage: [
        `repeating-linear-gradient(
          0deg,
          rgba(0,0,0,0.3) 0px,
          rgba(0,0,0,0.3) 2px,
          transparent 2px,
          transparent ${gridPx}px
        )`,
        `repeating-linear-gradient(
          90deg,
          rgba(0,0,0,0.3) 0px,
          rgba(0,0,0,0.3) 2px,
          transparent 2px,
          transparent ${gridPx}px
        )`,
      ].join(', '),
    };
  }

  if (id.includes('forest') || id.includes('outdoor')) {
    // Bright grass green with subtle variation
    return {
      background: '#4a8f2a',
      backgroundImage:
        `radial-gradient(ellipse 80% 60% at 30% 40%, rgba(90,160,50,0.5) 0%, transparent 60%),
         radial-gradient(ellipse 60% 80% at 70% 70%, rgba(38,100,18,0.4) 0%, transparent 50%)`,
    };
  }

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

  const mapStyle = getMapStyle(currentMap);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>

      {/* Layer 1: CSS map background — always visible, no PixiJS involved */}
      <div style={{
        position: 'absolute',
        inset: 0,
        ...mapStyle,
        transition: 'background 0.4s ease',
      }} />

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
