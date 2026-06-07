import { Application, Container, Graphics, FederatedPointerEvent } from 'pixi.js';
import type { RevealedArea, MapConfig } from '@/stores/gameStore';

type OnReveal = (area: RevealedArea) => void;

/**
 * FogOfWar — PixiJS 8 implementation
 *
 * Uses Graphics.cut() to punch transparent holes into the fog rectangle.
 * Pattern: g.rect(...).fill(fogColor).circle(cx,cy,r).cut()
 * PixiJS 8 internally uses Canvas2D evenodd fill rule for .cut().
 */
export class FogOfWar {
  private container: Container;
  private fogGraphics: Graphics;
  private dmOverlay: Graphics | null = null;
  private brushActive = false;
  private brushRadius = 70;
  private enabled = true;
  private isDM = false;
  private onReveal: OnReveal;
  private _dmBrushSetup = false;

  constructor(private app: Application, onReveal: OnReveal) {
    this.onReveal = onReveal;
    this.container = new Container();
    this.container.label = 'fog-layer';
    this.fogGraphics = new Graphics();
    this.container.addChild(this.fogGraphics);
  }

  attachToStage(index: number): void {
    this.app.stage.addChildAt(this.container, index);
  }

  setEnabled(enabled: boolean, isDM: boolean): void {
    this.enabled = enabled;
    this.isDM = isDM;
    this.container.visible = enabled;

    if (isDM && !this._dmBrushSetup) {
      this._setupDMBrush();
    }
  }

  setBrushMode(_mode: 'reveal' | 'hide'): void {
    // Future: support hide mode
  }

  setBrushRadius(radius: number): void {
    this.brushRadius = radius;
  }

  /** Called by CanvasContainer when the DM switches to/from a fog tool */
  setFogToolActive(active: boolean): void {
    if (this.dmOverlay) {
      this.dmOverlay.eventMode = active ? 'static' : 'none';
    }
  }

  drawFog(_config: MapConfig): void {
    this._redraw([], true);
  }

  updateRevealed(areas: RevealedArea[], _config: MapConfig): void {
    this._redraw(areas, false);
  }

  private _redraw(areas: RevealedArea[], fullCover: boolean): void {
    this.fogGraphics.clear();

    if (!this.enabled) return;

    const w = this.app.screen.width;
    const h = this.app.screen.height;
    // DM sees semi-transparent fog (can see map dimly); players see near-opaque
    const fogAlpha = this.isDM ? 0.55 : 0.95;

    if (fullCover || areas.length === 0) {
      // Solid fog, no holes
      this.fogGraphics.rect(0, 0, w, h).fill({ color: 0x000000, alpha: fogAlpha });
      return;
    }

    // Draw fog rect first, then cut revealed holes
    this.fogGraphics.rect(0, 0, w, h).fill({ color: 0x000000, alpha: fogAlpha });

    for (const area of areas) {
      this._cutArea(area);
    }
  }

  private _cutArea(area: RevealedArea): void {
    if (
      area.type === 'circle' &&
      area.cx !== undefined &&
      area.cy !== undefined &&
      area.radius !== undefined
    ) {
      this.fogGraphics.circle(area.cx, area.cy, area.radius).cut();
    } else if (
      area.type === 'rect' &&
      area.x !== undefined &&
      area.y !== undefined &&
      area.width !== undefined &&
      area.height !== undefined
    ) {
      this.fogGraphics.rect(area.x, area.y, area.width, area.height).cut();
    } else if (area.type === 'polygon' && area.points && area.points.length >= 3) {
      this.fogGraphics.poly(area.points.flatMap((p) => [p.x, p.y])).cut();
    }
  }

  private _setupDMBrush(): void {
    if (!this.isDM || this._dmBrushSetup) return;
    this._dmBrushSetup = true;

    // Transparent overlay — only active (intercepts events) when fog tool is selected.
    // eventMode starts as 'none'; call setFogToolActive(true) from CanvasContainer
    // when the DM switches to a fog tool.
    const overlay = new Graphics();
    overlay
      .rect(0, 0, this.app.screen.width, this.app.screen.height)
      .fill({ color: 0x000000, alpha: 0.001 });
    overlay.eventMode = 'none';
    this.dmOverlay = overlay;
    this.container.addChild(overlay);

    let isDrawing = false;

    overlay.on('pointerdown', () => {
      isDrawing = true;
    });

    overlay.on('pointermove', (e: FederatedPointerEvent) => {
      if (!isDrawing) return;

      const area: RevealedArea = {
        id: `brush-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: 'circle',
        cx: e.globalX,
        cy: e.globalY,
        radius: this.brushRadius,
      };

      this.onReveal(area);
    });

    overlay.on('pointerup', () => { isDrawing = false; });
    overlay.on('pointerupoutside', () => { isDrawing = false; });
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
