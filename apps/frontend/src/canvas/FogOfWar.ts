import { Application, Container, Graphics, FederatedPointerEvent } from 'pixi.js';
import type { RevealedArea, MapConfig } from '@/stores/gameStore';

type OnReveal = (area: RevealedArea) => void;

export class FogOfWar {
  private container: Container;
  private fogBg: Graphics;       // opaque black fog background
  private eraser: Graphics;      // draws "holes" using blendMode erase
  private brushActive = false;
  private brushMode: 'reveal' | 'hide' = 'reveal';
  private brushRadius = 70;
  private enabled = true;
  private isDM = false;
  private onReveal: OnReveal;

  constructor(private app: Application, onReveal: OnReveal) {
    this.onReveal = onReveal;

    // Render group = off-screen compositing buffer so blendMode erase works
    this.container = new Container();
    this.container.label = 'fog-layer';
    (this.container as any).isRenderGroup = true;

    this.fogBg = new Graphics();
    this.eraser = new Graphics();
    // blendMode 'erase' punches transparent holes in the fog buffer
    (this.eraser as any).blendMode = 'erase';

    this.container.addChild(this.fogBg);
    this.container.addChild(this.eraser);
  }

  attachToStage(index: number): void {
    this.app.stage.addChildAt(this.container, index);
  }

  setEnabled(enabled: boolean, isDM: boolean): void {
    this.enabled = enabled;
    this.isDM = isDM;
    this.container.visible = enabled;

    if (isDM) {
      this.setupDMBrush();
    }
  }

  setBrushMode(mode: 'reveal' | 'hide'): void {
    this.brushMode = mode;
  }

  setBrushRadius(radius: number): void {
    this.brushRadius = radius;
  }

  drawFog(_config: MapConfig): void {
    this.redraw([], true);
  }

  updateRevealed(areas: RevealedArea[], _config: MapConfig): void {
    this.redraw(areas, false);
  }

  private redraw(areas: RevealedArea[], fullCover: boolean): void {
    this.fogBg.clear();
    this.eraser.clear();

    if (!this.enabled) return;

    const w = this.app.screen.width;
    const h = this.app.screen.height;

    // Full-screen fog — DM sees semi-transparent (0.55), players see near-opaque (0.95)
    const fogAlpha = this.isDM ? 0.55 : 0.95;
    this.fogBg.rect(0, 0, w, h).fill({ color: 0x000000, alpha: fogAlpha });

    if (fullCover) return; // initial draw, no revealed areas yet

    // Erase revealed areas — each circle punches a transparent hole in the fog
    for (const area of areas) {
      this.drawErasedArea(area);
    }
  }

  private drawErasedArea(area: RevealedArea): void {
    if (
      area.type === 'circle' &&
      area.cx !== undefined &&
      area.cy !== undefined &&
      area.radius !== undefined
    ) {
      // Soft feathered edge — draw multiple circles with decreasing opacity
      const r = area.radius;
      // Full erase in the centre
      this.eraser.circle(area.cx, area.cy, r).fill({ color: 0xffffff, alpha: 1 });
    } else if (
      area.type === 'rect' &&
      area.x !== undefined &&
      area.y !== undefined &&
      area.width !== undefined &&
      area.height !== undefined
    ) {
      this.eraser
        .rect(area.x, area.y, area.width, area.height)
        .fill({ color: 0xffffff, alpha: 1 });
    } else if (area.type === 'polygon' && area.points && area.points.length >= 3) {
      this.eraser
        .poly(area.points.flatMap((p) => [p.x, p.y]))
        .fill({ color: 0xffffff, alpha: 1 });
    }
  }

  private _dmBrushSetup = false;

  private setupDMBrush(): void {
    if (!this.isDM || this._dmBrushSetup) return;
    this._dmBrushSetup = true;

    // Transparent overlay captures pointer events for the DM brush
    const dmOverlay = new Graphics();
    dmOverlay
      .rect(0, 0, this.app.screen.width, this.app.screen.height)
      .fill({ color: 0x000000, alpha: 0.001 });
    dmOverlay.eventMode = 'static';
    this.container.addChild(dmOverlay);

    let isDrawing = false;

    dmOverlay.on('pointerdown', () => {
      isDrawing = true;
    });

    dmOverlay.on('pointermove', (e: FederatedPointerEvent) => {
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

    dmOverlay.on('pointerup', () => {
      isDrawing = false;
    });

    dmOverlay.on('pointerupoutside', () => {
      isDrawing = false;
    });
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
