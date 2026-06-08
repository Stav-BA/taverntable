/**
 * FogCanvas — HTML5 Canvas2D overlay for fog of war.
 *
 * Uses destination-out composite operation to punch holes — this avoids
 * the evenodd overlap-cancellation bug where overlapping circles create
 * a psychedelic alternating pattern.
 */
import { useRef, useEffect, useCallback } from 'react';
import type { RevealedArea } from '@/stores/gameStore';

interface Props {
  areas: RevealedArea[];
  isDM: boolean;
  fogEnabled: boolean;
  fogToolActive: boolean;
  brushRadius?: number;
  onReveal: (area: RevealedArea) => void;
}

export function FogCanvas({ areas, isDM, fogEnabled, fogToolActive, brushRadius = 70, onReveal }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

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

    // Step 1: draw solid fog rectangle
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(0,0,0,${fogAlpha})`;
    ctx.fillRect(0, 0, w, h);

    // Step 2: punch holes using destination-out — overlapping circles merge cleanly
    ctx.globalCompositeOperation = 'destination-out';
    for (const area of areas) {
      if (area.type === 'circle' && area.cx !== undefined && area.cy !== undefined && area.radius !== undefined) {
        ctx.beginPath();
        ctx.arc(area.cx, area.cy, area.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Reset composite mode
    ctx.globalCompositeOperation = 'source-over';
  }, [areas, isDM, fogEnabled]);

  useEffect(() => { draw(); }, [draw]);

  // ── Resize observer ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      draw();
    });
    ro.observe(canvas);

    canvas.width = canvas.offsetWidth || 800;
    canvas.height = canvas.offsetHeight || 600;
    draw();

    return () => ro.disconnect();
  }, [draw]);

  // ── DM brush pointer handlers ─────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!fogToolActive) return;
    isDrawingRef.current = true;
    lastPosRef.current = null;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    // Paint immediately on click
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    lastPosRef.current = { x: cx, y: cy };
    onReveal({ id: `brush-${Date.now()}`, type: 'circle', cx, cy, radius: brushRadius });
  }, [fogToolActive, brushRadius, onReveal]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !fogToolActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Only emit a new circle if moved at least half the brush radius
    const last = lastPosRef.current;
    if (last) {
      const dx = cx - last.x;
      const dy = cy - last.y;
      if (Math.sqrt(dx * dx + dy * dy) < brushRadius * 0.5) return;
    }
    lastPosRef.current = { x: cx, y: cy };
    onReveal({ id: `brush-${Date.now()}`, type: 'circle', cx, cy, radius: brushRadius });
  }, [fogToolActive, brushRadius, onReveal]);

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
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
