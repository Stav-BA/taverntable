import {
  Application,
  Container,
  Sprite,
  Assets,
  Graphics,
} from 'pixi.js';
import type { MapConfig } from '@/stores/gameStore';

export class MapRenderer {
  private container: Container;
  private mapSprite: Sprite | null = null;
  private mapGraphics: Graphics | null = null;
  private loadedMapId: string | null = null;

  constructor(private app: Application) {
    this.container = new Container();
    this.container.label = 'map-layer';
    this.app.stage.addChildAt(this.container, 0);
  }

  async loadMap(config: MapConfig): Promise<void> {
    if (this.loadedMapId === config.id) return;

    this.container.removeChildren();
    this.mapSprite = null;
    this.mapGraphics = null;

    // Try loading the actual image; if it fails (404) fall back to a procedural map
    try {
      const texture = await Assets.load(config.imageUrl);
      const sprite = new Sprite(texture);
      this.fitToStage(sprite, config);
      this.container.addChild(sprite);
      this.mapSprite = sprite;
    } catch {
      // Image not found — draw a themed procedural map so the canvas isn't empty
      const gfx = this.buildProceduralMap(config);
      this.container.addChild(gfx);
      this.mapGraphics = gfx;
    }

    this.loadedMapId = config.id;
  }

  /** Call this after a resize event to redraw the procedural map at the new size */
  redrawIfProcedural(config: MapConfig): void {
    if (!this.mapGraphics || this.loadedMapId !== config.id) return;
    this.container.removeChildren();
    this.mapGraphics = null;
    const gfx = this.buildProceduralMap(config);
    this.container.addChild(gfx);
    this.mapGraphics = gfx;
  }

  // ── Procedural map builder ─────────────────────────────────────────────────

  private buildProceduralMap(config: MapConfig): Graphics {
    // Use screen size if available; fall back to a safe minimum so PixiJS
    // doesn't draw at 0×0 if the canvas hasn't been sized yet on first render.
    const stageW = Math.max(this.app.screen.width, 1200);
    const stageH = Math.max(this.app.screen.height, 700);
    const gfx = new Graphics();

    if (config.id.includes('tavern') || config.id.includes('inn')) {
      this.drawTavernFloor(gfx, stageW, stageH, config);
    } else if (config.id.includes('dungeon') || config.id.includes('cave')) {
      this.drawDungeonFloor(gfx, stageW, stageH, config);
    } else if (config.id.includes('forest') || config.id.includes('outdoor')) {
      this.drawForestGround(gfx, stageW, stageH, config);
    } else {
      this.drawGenericFloor(gfx, stageW, stageH, config);
    }

    return gfx;
  }

  /**
   * Warm wood plank floor — tavern / inn
   * Colours chosen bright enough to show clearly through 55% fog.
   */
  private drawTavernFloor(g: Graphics, w: number, h: number, cfg: MapConfig): void {
    // Base: warm medium oak
    g.rect(0, 0, w, h).fill({ color: 0xb87c4a });

    const cellW = w / cfg.gridCols;
    const cellH = h / cfg.gridRows;
    const plankH = Math.max(cellH, 20);

    // Alternating wood plank rows
    for (let row = 0; row < Math.ceil(h / plankH) + 1; row++) {
      const y = row * plankH;
      const shade = row % 2 === 0 ? 0xc4874f : 0xa86e3c;
      g.rect(0, y, w, plankH).fill({ color: shade });
    }

    // Plank seam lines — dark brown
    for (let row = 0; row <= Math.ceil(h / plankH) + 1; row++) {
      const y = row * plankH;
      g.moveTo(0, y).lineTo(w, y).stroke({ color: 0x5c3010, width: 2, alpha: 0.7 });
    }

    // Vertical grain marks every 2 grid columns
    for (let col = 0; col < cfg.gridCols; col += 2) {
      const x = col * cellW;
      g.moveTo(x, 0).lineTo(x, h).stroke({ color: 0x7a4520, width: 1, alpha: 0.3 });
    }
  }

  /**
   * Stone block floor — dungeon / cave
   * Medium gray so it's visible through fog.
   */
  private drawDungeonFloor(g: Graphics, w: number, h: number, cfg: MapConfig): void {
    // Base: medium cool gray
    g.rect(0, 0, w, h).fill({ color: 0x888899 });

    const cellW = w / cfg.gridCols;
    const cellH = h / cfg.gridRows;
    const bW = Math.max(cellW * 1.5, 40);
    const bH = Math.max(cellH * 0.8, 24);

    // Offset brickwork — alternating lighter / darker gray
    for (let row = 0; row < Math.ceil(h / bH) + 1; row++) {
      const yy = row * bH;
      const xOffset = (row % 2) * (bW * 0.5);
      for (let col = -1; col < Math.ceil(w / bW) + 1; col++) {
        const xx = col * bW + xOffset;
        const shade = (row + col) % 2 === 0 ? 0x9a9aaa : 0x787888;
        g.rect(xx + 1, yy + 1, bW - 2, bH - 2).fill({ color: shade });
      }
    }

    // Mortar lines — dark gray
    for (let row = 0; row <= Math.ceil(h / bH); row++) {
      g.moveTo(0, row * bH).lineTo(w, row * bH).stroke({ color: 0x444455, width: 2, alpha: 0.8 });
    }
  }

  /**
   * Grassy ground — forest / outdoor
   * Bright medium greens.
   */
  private drawForestGround(g: Graphics, w: number, h: number, cfg: MapConfig): void {
    // Base: medium grass green
    g.rect(0, 0, w, h).fill({ color: 0x5a9e35 });

    const cellW = w / cfg.gridCols;
    const cellH = h / cfg.gridRows;

    // Varied grass tiles
    for (let col = 0; col < cfg.gridCols; col++) {
      for (let row = 0; row < cfg.gridRows; row++) {
        const idx = (col * 3 + row * 7) % 4;
        const shade = idx === 0 ? 0x68b83e : idx === 1 ? 0x4e8c2b : idx === 2 ? 0x5fa532 : 0x72c040;
        g.rect(col * cellW + 0.5, row * cellH + 0.5, cellW - 1, cellH - 1).fill({ color: shade });
      }
    }

    // Scattered bright flowers
    for (let i = 0; i < 30; i++) {
      const fx = ((i * 137 + 23) % cfg.gridCols) * cellW + cellW * 0.4;
      const fy = ((i * 97 + 11) % cfg.gridRows) * cellH + cellH * 0.4;
      g.circle(fx, fy, 3).fill({ color: i % 2 === 0 ? 0xffee44 : 0xff9999 });
    }
  }

  /** Generic — neutral medium-tone stone */
  private drawGenericFloor(g: Graphics, w: number, h: number, cfg: MapConfig): void {
    g.rect(0, 0, w, h).fill({ color: 0x7a7080 });
    const cellW = w / cfg.gridCols;
    const cellH = h / cfg.gridRows;
    for (let col = 0; col < cfg.gridCols; col++) {
      for (let row = 0; row < cfg.gridRows; row++) {
        const shade = (col + row) % 2 === 0 ? 0x827088 : 0x726070;
        g.rect(col * cellW + 1, row * cellH + 1, cellW - 2, cellH - 2).fill({ color: shade });
      }
    }
  }

  // ── Sprite fitting ─────────────────────────────────────────────────────────

  private fitToStage(sprite: Sprite, config: MapConfig): void {
    const stageW = this.app.screen.width;
    const stageH = this.app.screen.height;
    const mapW = config.gridCols * config.gridSizePx;
    const mapH = config.gridRows * config.gridSizePx;

    const scale = Math.min(stageW / mapW, stageH / mapH);
    sprite.scale.set(scale);
    sprite.x = (stageW - mapW * scale) / 2;
    sprite.y = (stageH - mapH * scale) / 2;
  }

  resize(): void {
    // Re-fit on resize if needed
  }

  getMapSprite(): Sprite | null {
    return this.mapSprite;
  }

  getContainer(): Container {
    return this.container;
  }

  gridToStage(gridX: number, gridY: number, config: MapConfig): { x: number; y: number } {
    const stageW = this.app.screen.width;
    const stageH = this.app.screen.height;
    const mapW = config.gridCols * config.gridSizePx;
    const mapH = config.gridRows * config.gridSizePx;
    const scale = Math.min(stageW / mapW, stageH / mapH);
    const offsetX = (stageW - mapW * scale) / 2;
    const offsetY = (stageH - mapH * scale) / 2;
    const cellW = config.gridSizePx * scale;
    const cellH = config.gridSizePx * scale;
    return {
      x: offsetX + gridX * cellW + cellW / 2,
      y: offsetY + gridY * cellH + cellH / 2,
    };
  }

  stageToGrid(stageX: number, stageY: number, config: MapConfig): { col: number; row: number } {
    const stageW = this.app.screen.width;
    const stageH = this.app.screen.height;
    const mapW = config.gridCols * config.gridSizePx;
    const mapH = config.gridRows * config.gridSizePx;
    const scale = Math.min(stageW / mapW, stageH / mapH);
    const offsetX = (stageW - mapW * scale) / 2;
    const offsetY = (stageH - mapH * scale) / 2;
    const cellW = config.gridSizePx * scale;
    const cellH = config.gridSizePx * scale;
    return {
      col: Math.floor((stageX - offsetX) / cellW),
      row: Math.floor((stageY - offsetY) / cellH),
    };
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
