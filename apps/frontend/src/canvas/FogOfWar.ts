import { Application, Container, Graphics, FederatedPointerEvent } from 'pixi.js';
import type { RevealedArea, MapConfig } from '@/stores/gameStore';

type OnReveal = (area: RevealedArea) => void;

export class FogOfWar {
  private container: Container;
  private fogMask: Graphics;
  private revealedGraphics: Graphics;
  private brushActive = false;
  private brushMode: 'reveal' | 'hide' = 'reveal';
  private brushRadius = 70;
  private enabled = true;
  private isDM = false;
  private onReveal: OnReveal;
  private currentConfig: MapConfig | null = null;

  constructor(private app: Application, onReveal: OnReveal) {
    this.onReveal = onReveal;
    this.container = new Container();
    this.container.label = 'fog-layer';

    // The fog overlay (black, alpha mask approach)
    this.fogMask = new Graphics();
    this.revealedGraphics = new Graphics();

    this.container.addChild(this.fogMask);
    this.container.addChild(this.revealedGraphics);
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

  drawFog(config: MapConfig): void {
    this.currentConfig = config;
    this.redraw([], config);
  }

  updateRevealed(areas: RevealedArea[], config: MapConfig): void {
    this.currentConfig = config;
    this.redraw(areas, config);
  }

  private redraw(areas: RevealedArea[], config: MapConfig): void {
    this.fogMask.clear();
    this.revealedGraphics.clear();

    if (!this.enabled) return;

    const stageW = this.app.screen.width;
    const stageH = this.app.screen.height;

    // Full-screen dark fog
    this.fogMask
      .rect(0, 0, stageW, stageH)
      .fill({ color: 0x000000, alpha: this.isDM ? 0.5 : 0.95 });

    // Reveal holes using blendMode (erase effect via alpha)
    for (const area of areas) {
      this.drawRevealedArea(area);
    }
  }

  private drawRevealedArea(area: RevealedArea): void {
    if (area.type === 'circle' && area.cx !== undefined && area.cy !== undefined && area.radius !== undefined) {
      // Use a semi-transparent clear circle
      this.revealedGraphics
        .circle(area.cx, area.cy, area.radius)
        .fill({ color: 0x000000, alpha: 0 });

      // Soft edge
      for (let r = area.radius; r > area.radius - 20; r -= 4) {
        const edgeAlpha = this.isDM ? 0.3 : 0.8;
        const adjustedAlpha = edgeAlpha * (1 - (area.radius - r) / 20);
        this.fogMask
          .circle(area.cx, area.cy, r)
          .fill({ color: 0x000000, alpha: adjustedAlpha });
      }

      // Clear center
      this.fogMask
        .circle(area.cx, area.cy, area.radius - 20)
        .fill({ color: 0x000000, alpha: 0 });
    } else if (
      area.type === 'rect' &&
      area.x !== undefined &&
      area.y !== undefined &&
      area.width !== undefined &&
      area.height !== undefined
    ) {
      this.fogMask
        .rect(area.x, area.y, area.width, area.height)
        .fill({ color: 0x000000, alpha: 0 });
    } else if (area.type === 'polygon' && area.points && area.points.length >= 3) {
      this.fogMask.poly(area.points.flatMap((p) => [p.x, p.y])).fill({ color: 0x000000, alpha: 0 });
    }
  }

  private setupDMBrush(): void {
    if (!this.isDM) return;

    // Transparent overlay for DM brush
    const dmOverlay = new Graphics();
    dmOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height).fill({
      color: 0x000000,
      alpha: 0.001,
    });
    dmOverlay.eventMode = 'static';
    this.container.addChild(dmOverlay);

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    dmOverlay.on('pointerdown', (e: FederatedPointerEvent) => {
      isDrawing = true;
      lastX = e.globalX;
      lastY = e.globalY;
    });

    dmOverlay.on('pointermove', (e: FederatedPointerEvent) => {
      if (!isDrawing) return;

      const x = e.globalX;
      const y = e.globalY;

      const area: RevealedArea = {
        id: `brush-${Date.now()}-${Math.random()}`,
        type: 'circle',
        cx: x,
        cy: y,
        radius: this.brushRadius,
      };

      this.onReveal(area);
      lastX = x;
      lastY = y;
    });

    dmOverlay.on('pointerup', () => {
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
