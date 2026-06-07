import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useSessionStore } from '@/stores/sessionStore';
import { socketEmit } from '@/lib/socket';
import { createPixiApp, destroyPixiApp } from './PixiApp';
import { MapRenderer } from './MapRenderer';
import { GridSystem } from './GridSystem';
import { TokenManager } from './TokenManager';
import { FogOfWar } from './FogOfWar';
import type { Application } from 'pixi.js';
import type { RevealedArea } from '@/stores/gameStore';

export default function CanvasContainer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const mapRendererRef = useRef<MapRenderer | null>(null);
  const gridRef = useRef<GridSystem | null>(null);
  const tokenManagerRef = useRef<TokenManager | null>(null);
  const fogRef = useRef<FogOfWar | null>(null);
  const [ready, setReady] = useState(false);

  const currentMap = useGameStore((s) => s.currentMap);
  const tokens = useGameStore((s) => s.tokens);
  const fogRevealed = useGameStore((s) => s.fogRevealed);
  const fogEnabled = useGameStore((s) => s.fogEnabled);
  const addRevealedArea = useGameStore((s) => s.addRevealedArea);

  const player = useSessionStore((s) => s.player);
  const isDM = useSessionStore((s) => s.isDM);
  const activeTool = useSessionStore((s) => s.activeTool);

  // Initialise PixiJS
  useEffect(() => {
    if (!canvasRef.current) return;

    let mounted = true;

    const init = async () => {
      const app = await createPixiApp(canvasRef.current!);
      if (!mounted) return;

      appRef.current = app;
      app.stage.eventMode = 'static';

      // Layers in Z order: map → grid → fog → tokens
      const mapRenderer = new MapRenderer(app);
      mapRendererRef.current = mapRenderer;

      const grid = new GridSystem(app);
      grid.attachToStage(1);
      gridRef.current = grid;

      const handleReveal = (area: RevealedArea) => {
        addRevealedArea(area);
        socketEmit.fogReveal(area as unknown as Record<string, unknown>);
      };

      const fog = new FogOfWar(app, handleReveal);
      fog.attachToStage(2);
      fogRef.current = fog;

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
      tokenManager.attachToStage(3);
      tokenManagerRef.current = tokenManager;

      setReady(true);
    };

    init();

    return () => {
      mounted = false;
      destroyPixiApp();
      appRef.current = null;
      mapRendererRef.current = null;
      gridRef.current = null;
      tokenManagerRef.current = null;
      fogRef.current = null;
      setReady(false);
    };
  }, []);

  // Map change
  useEffect(() => {
    if (!ready || !currentMap || !mapRendererRef.current || !gridRef.current) return;
    mapRendererRef.current.loadMap(currentMap);
    gridRef.current.drawGrid(currentMap);

    // PixiJS may not have its final size on the very first render tick.
    // Redraw the procedural map after a short delay to guarantee correct dimensions.
    const t = setTimeout(() => {
      mapRendererRef.current?.redrawIfProcedural(currentMap);
      gridRef.current?.drawGrid(currentMap);
    }, 300);
    return () => clearTimeout(t);
  }, [ready, currentMap]);

  // Token sync
  useEffect(() => {
    if (!ready || !currentMap || !tokenManagerRef.current || !player) return;
    tokenManagerRef.current.syncTokens(tokens, currentMap, player.id, isDM);
  }, [ready, tokens, currentMap, player, isDM]);

  // Fog sync
  useEffect(() => {
    if (!ready || !fogRef.current || !currentMap) return;
    fogRef.current.setEnabled(fogEnabled, isDM);
    if (fogEnabled) {
      fogRef.current.updateRevealed(fogRevealed, currentMap);
    }
  }, [ready, fogEnabled, fogRevealed, isDM, currentMap]);

  // Fog tool active — only let the DM brush paint when fog-reveal/fog-hide is selected
  useEffect(() => {
    if (!ready || !fogRef.current) return;
    const isFogTool = activeTool === 'fog-reveal' || activeTool === 'fog-hide';
    fogRef.current.setFogToolActive(isDM && isFogTool);
  }, [ready, activeTool, isDM]);

  return (
    <div className="canvas-wrapper w-full h-full relative">
      <canvas
        ref={canvasRef}
        id="pixi-canvas"
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      {!ready && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: '#0a0a0a' }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 rounded-full border-4 border-gold animate-spin"
              style={{ borderTopColor: 'transparent' }}
            />
            <p className="font-cinzel text-gold text-sm tracking-wider">Loading Map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
