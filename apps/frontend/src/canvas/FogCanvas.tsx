/**
 * FogCanvas — HTML5 Canvas2D overlay for fog of war.
 *
 * Sits on top of the PixiJS canvas as an absolutely-positioned element.
 * Uses Canvas2D fill('evenodd') to punch transparent holes in the fog,
 * which is 100% reliable and independent of PixiJS rendering.
 */
import { useRef, useEffect, useCallback } from 'react';
import type { RevealedArea } from '@/stores/gameStore';

interface Props {
  areas: RevealedArea[];
  isDM: boolean;
  fogEnabled: boolean;
  fogToolActive: boolean;   // true only when DM has fog-reveal/fog-hide selected
  brushRadius?: number;
  onReveal: (area: RevealedArea) => void;
}

export function FogCanvas({ areas, isDM, fogEnabled, fogToolActive, brushRadius = 70, onReveal }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // ── Draw fog ──────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: w, height: h } = canvas;

    ctx.clearRect(0, 0, w, h);

    if (!fogEnabled) return;

    const fogAlpha = isDM ? 0.55 : 0.95;

    // Build path: full-screen rectangle + revealed holes (CCW = evenodd holes)
    ctx.beginPath();
    ctx.rect(0, 0, w, h);

    for (const area of areas) {
      if (area.type === 'circle' && area.cx !== undefined && area.cy !== undefined && area.radius !== undefined) {
        // Counter-clockwise arc = hole in evenodd winding
        ctx.arc(area.cx, area.cy, area.radius, 0, Math.PI * 2, true);
      } else if (area.type === 'rect' && area.x !== undefined && area.y !== undefined) {
        // CCW rect: go right-to-left
        ctx.rect(area.x + area.width!, area.y, -area.width!, area.height!);
      } else if (area.type === 'polygon' && area.points && area.points.length >= 3) {
        // Draw polygon CCW
        const pts = [...area.points].reverse();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
      }
    }

    ctx.fillStyle = `rgba(0,0,0,${fogAlpha})`;
    ctx.fill('evenodd');
  }, [areas, isDM, fogEnabled]);

  // Redraw whenever deps change
  useEffect(() => {
    draw();
  }, [draw]);

  // ── Resize observer — keep canvas pixel dimensions in sync with CSS size ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      draw();
    });
    ro.observe(canvas);

    // Initial size
    canvas.width = canvas.offsetWidth || 800;
    canvas.height = canvas.offsetHeight || 600;
    draw();

    return () => ro.disconnect();
  }, [draw]);

  // ── DM brush pointer handlers ─────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!fogToolActive) return;
    isDrawingRef.current = true;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  }, [fogToolActive]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !fogToolActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    onReveal({
      id: `brush-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: 'circle',
      cx: e.clientX - rect.left,
      cy: e.clientY - rect.top,
      radius: brushRadius,
    });
  }, [fogToolActive, brushRadius, onReveal]);

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  if (!fogEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        // Only intercept pointer events when the DM is using a fog tool
        pointerEvents: isDM && fogToolActive ? 'auto' : 'none',
        cursor: isDM && fogToolActive ? 'crosshair' : 'default',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
