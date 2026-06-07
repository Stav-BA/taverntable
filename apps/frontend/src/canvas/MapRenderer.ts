import {
  Application,
  Container,
  Sprite,
  Assets,
  Texture,
  Graphics,
} from 'pixi.js';
import type { MapConfig } from '@/stores/gameStore';

export class MapRenderer {
  private container: Container;
  private mapSprite: Sprite | null = null;
  private loadedMapId: string | null = null;

  constructor(private app: Application) {
    this.container = new Container();
    this.container.label = 'map-layer';
    this.app.stage.addChildAt(this.container, 0);
  }

  async loadMap(config: MapConfig): Promise<void> {
    if (this.loadedMapId === config.id) return;

    // Clear existing
    this.container.removeChildren();
    this.mapSprite = null;

    try {
      let texture: Texture;

      try {
        texture = await Assets.load(config.imageUrl);
      } catch {
        // Fallback: generate a procedural map placeholder
        texture = this.generatePlaceholderTexture(config);
      }

      const sprite = new Sprite(texture);
      sprite.label = 'map-sprite';

      // Scale map to fill canvas while maintaining aspect ratio
      this.fitToStage(sprite, config);

      this.container.addChild(sprite);
      this.mapSprite = sprite;
      this.loadedMapId = config.id;
    } catch (err) {
      console.error('[MapRenderer] Failed to load map:', err);
      // Still create a placeholder
      const placeholder = this.createColorPlaceholder(config);
      this.container.addChild(placeholder);
      this.loadedMapId = config.id;
    }
  }

  private fitToStage(sprite: Sprite, config: MapConfig): void {
    const stageW = this.app.screen.width;
    const stageH = this.app.screen.height;
    const mapW = config.gridCols * config.gridSizePx;
    const mapH = config.gridRows * config.gridSizePx;

    // Scale to fit
    const scaleX = stageW / mapW;
    const scaleY = stageH / mapH;
    const scale = Math.min(scaleX, scaleY);

    sprite.scale.set(scale);
    sprite.x = (stageW - mapW * scale) / 2;
    sprite.y = (stageH - mapH * scale) / 2;
  }

  private generatePlaceholderTexture(config: MapConfig): Texture {
    const gfx = new Graphics();
    const w = config.gridCols * config.gridSizePx;
    const h = config.gridRows * config.gridSizePx;

    // Stone floor pattern
    gfx.rect(0, 0, w, h).fill({ color: 0x2a2a2a });

    // Tile pattern
    const tileSize = 70;
    for (let x = 0; x < w; x += tileSize) {
      for (let y = 0; y < h; y += tileSize) {
        const shade = ((x / tileSize + y / tileSize) % 2 === 0) ? 0x282828 : 0x303030;
        gfx
          .rect(x + 1, y + 1, tileSize - 2, tileSize - 2)
          .fill({ color: shade });
      }
    }

    return this.app.renderer.generateTexture(gfx);
  }

  private createColorPlaceholder(config: MapConfig): Graphics {
    const gfx = new Graphics();
    const stageW = this.app.screen.width;
    const stageH = this.app.screen.height;

    gfx.rect(0, 0, stageW, stageH).fill({ color: 0x1a1a2e });

    // Simple grid lines as placeholder
    const cellW = stageW / config.gridCols;
    const cellH = stageH / config.gridRows;

    for (let x = 0; x <= config.gridCols; x++) {
      gfx.moveTo(x * cellW, 0).lineTo(x * cellW, stageH);
    }
    for (let y = 0; y <= config.gridRows; y++) {
      gfx.moveTo(0, y * cellH).lineTo(stageW, y * cellH);
    }

    gfx.stroke({ color: 0x333355, width: 1 });

    return gfx;
  }

  resize(): void {
    // Re-fit map sprite on resize
    if (this.mapSprite) {
      // Let PixiJS handle via resizeTo
    }
  }

  getMapSprite(): Sprite | null {
    return this.mapSprite;
  }

  getContainer(): Container {
    return this.container;
  }

  /** Returns the pixel position of a grid cell's top-left corner on stage */
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

  /** Returns grid coords from stage position */
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
