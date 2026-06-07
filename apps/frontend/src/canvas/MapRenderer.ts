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

  // ── Procedural map builder ─────────────────────────────────────────────────

  private buildProceduralMap(config: MapConfig): Graphics {
    const stageW = this.app.screen.width;
    const stageH = this.app.screen.height;
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

  /** Warm wood plank floor — tavern / inn */
  private drawTavernFloor(g: Graphics, w: number, h: number, cfg: MapConfig): void {
    // Base warm wood colour
    g.rect(0, 0, w, h).fill({ color: 0x5c3d1e });

    const cellW = w / cfg.gridCols;
    const cellH = h / cfg.gridRows;
    const plankH = cellH * 1.5;

    // Horizontal wood planks
    for (let row = 0; row < cfg.gridRows * 2; row++) {
      const y = row * plankH * 0.5;
      const offset = (row % 2) * (cellW * 1.5);
      const shade = row % 3 === 0 ? 0x6b4423 : row % 3 === 1 ? 0x7a4f2a : 0x5a3418;
      g.rect(0, y, w, plankH).fill({ color: shade });

      // Wood grain lines
      for (let x = offset; x < w + cellW * 3; x += cellW * 3) {
        g.moveTo(x, y).lineTo(x + cellW * 0.3, y + plankH).stroke({ color: 0x4a2e12, width: 1, alpha: 0.4 });
      }
    }

    // Plank seam lines
    for (let row = 0; row < cfg.gridRows * 2 + 1; row++) {
      const y = row * plankH * 0.5;
      g.moveTo(0, y).lineTo(w, y).stroke({ color: 0x3d2008, width: 1.5, alpha: 0.6 });
    }

    // Subtle vignette around the edges (darker border)
    g.rect(0, 0, w, 8).fill({ color: 0x000000, alpha: 0.3 });
    g.rect(0, h - 8, w, 8).fill({ color: 0x000000, alpha: 0.3 });
    g.rect(0, 0, 8, h).fill({ color: 0x000000, alpha: 0.3 });
    g.rect(w - 8, 0, 8, h).fill({ color: 0x000000, alpha: 0.3 });
  }

  /** Dark stone block floor — dungeon / cave */
  private drawDungeonFloor(g: Graphics, w: number, h: number, cfg: MapConfig): void {
    // Dark base
    g.rect(0, 0, w, h).fill({ color: 0x1e1e2e });

    const cellW = w / cfg.gridCols;
    const cellH = h / cfg.gridRows;
    const bW = cellW * 1.5;
    const bH = cellH * 0.75;

    // Stone blocks — offset brickwork pattern
    for (let row = 0; row < Math.ceil(h / bH) + 1; row++) {
      const yy = row * bH;
      const xOffset = (row % 2) * (bW * 0.5);
      for (let col = -1; col < Math.ceil(w / bW) + 1; col++) {
        const xx = col * bW + xOffset;
        const shade = (row + col) % 3 === 0 ? 0x2a2a3e : (row + col) % 3 === 1 ? 0x252535 : 0x222232;
        g.rect(xx + 1, yy + 1, bW - 2, bH - 2).fill({ color: shade });

        // Cracks / texture
        if ((row * 3 + col * 7) % 11 === 0) {
          g.moveTo(xx + bW * 0.3, yy + bH * 0.2)
            .lineTo(xx + bW * 0.6, yy + bH * 0.5)
            .lineTo(xx + bW * 0.5, yy + bH * 0.8)
            .stroke({ color: 0x111120, width: 1, alpha: 0.5 });
        }
      }
    }

    // Mortar lines
    for (let row = 0; row <= Math.ceil(h / bH); row++) {
      const yy = row * bH;
      g.moveTo(0, yy).lineTo(w, yy).stroke({ color: 0x111120, width: 2, alpha: 0.8 });
    }

    // Subtle torchlight warmth at centre
    g.circle(w / 2, h / 2, Math.min(w, h) * 0.35).fill({ color: 0x3d2808, alpha: 0.08 });
  }

  /** Grassy ground — forest / outdoor */
  private drawForestGround(g: Graphics, w: number, h: number, cfg: MapConfig): void {
    // Base grass
    g.rect(0, 0, w, h).fill({ color: 0x2d5a1b });

    const cellW = w / cfg.gridCols;
    const cellH = h / cfg.gridRows;
    const patch = cellW * 0.9;

    // Grass patches with varied shades
    for (let col = 0; col < cfg.gridCols; col++) {
      for (let row = 0; row < cfg.gridRows; row++) {
        const x = col * cellW + cellW * 0.05;
        const y = row * cellH + cellH * 0.05;
        const shade =
          (col * 3 + row * 7) % 5 === 0 ? 0x3a7022 :
          (col * 3 + row * 7) % 5 === 1 ? 0x265018 :
          (col * 3 + row * 7) % 5 === 2 ? 0x316219 :
          (col * 3 + row * 7) % 5 === 3 ? 0x1e4014 : 0x2d5a1b;
        g.rect(x, y, patch, patch).fill({ color: shade });
      }
    }

    // Scattered flowers / stones
    for (let i = 0; i < 40; i++) {
      const fx = ((i * 137 + 23) % cfg.gridCols) * cellW + cellW * 0.3;
      const fy = ((i * 97 + 11) % cfg.gridRows) * cellH + cellH * 0.3;
      const isFlower = i % 3 !== 0;
      if (isFlower) {
        g.circle(fx, fy, 3).fill({ color: i % 2 === 0 ? 0xffdd44 : 0xff8888, alpha: 0.8 });
      } else {
        g.rect(fx - 3, fy - 2, 6, 4).fill({ color: 0x888888, alpha: 0.6 });
      }
    }

    // Subtle tree shadows at edges
    g.rect(0, 0, 20, h).fill({ color: 0x000000, alpha: 0.25 });
    g.rect(w - 20, 0, 20, h).fill({ color: 0x000000, alpha: 0.25 });
    g.rect(0, 0, w, 20).fill({ color: 0x000000, alpha: 0.25 });
    g.rect(0, h - 20, w, 20).fill({ color: 0x000000, alpha: 0.25 });
  }

  /** Generic stone / neutral floor */
  private drawGenericFloor(g: Graphics, w: number, h: number, cfg: MapConfig): void {
    g.rect(0, 0, w, h).fill({ color: 0x3a3040 });
    const cellW = w / cfg.gridCols;
    const cellH = h / cfg.gridRows;
    for (let col = 0; col < cfg.gridCols; col++) {
      for (let row = 0; row < cfg.gridRows; row++) {
        const shade = (col + row) % 2 === 0 ? 0x383040 : 0x3e3648;
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
