import { Application, Container, Graphics } from 'pixi.js';
import type { MapConfig } from '@/stores/gameStore';

export class GridSystem {
  private container: Container;
  private gridGraphics: Graphics;
  private config: MapConfig | null = null;

  constructor(private app: Application) {
    this.container = new Container();
    this.container.label = 'grid-layer';
    this.gridGraphics = new Graphics();
    this.container.addChild(this.gridGraphics);
  }

  attachToStage(index: number): void {
    this.app.stage.addChildAt(this.container, index);
  }

  drawGrid(config: MapConfig): void {
    this.config = config;
    this.redraw();
  }

  redraw(): void {
    if (!this.config) return;

    const config = this.config;
    this.gridGraphics.clear();

    const stageW = this.app.screen.width;
    const stageH = this.app.screen.height;
    const mapW = config.gridCols * config.gridSizePx;
    const mapH = config.gridRows * config.gridSizePx;
    const scale = Math.min(stageW / mapW, stageH / mapH);
    const offsetX = (stageW - mapW * scale) / 2;
    const offsetY = (stageH - mapH * scale) / 2;
    const cellW = config.gridSizePx * scale;
    const cellH = config.gridSizePx * scale;

    const totalW = config.gridCols * cellW;
    const totalH = config.gridRows * cellH;

    // Draw thin grid lines
    this.gridGraphics.setStrokeStyle({ color: 0x444466, width: 0.5, alpha: 0.5 });

    for (let col = 0; col <= config.gridCols; col++) {
      const x = offsetX + col * cellW;
      this.gridGraphics.moveTo(x, offsetY).lineTo(x, offsetY + totalH);
    }

    for (let row = 0; row <= config.gridRows; row++) {
      const y = offsetY + row * cellH;
      this.gridGraphics.moveTo(offsetX, y).lineTo(offsetX + totalW, y);
    }

    this.gridGraphics.stroke();

    // Draw every 5-square markers (5ft = 1 square, so 25ft markers)
    this.gridGraphics.setStrokeStyle({ color: 0x6666aa, width: 1, alpha: 0.3 });

    for (let col = 0; col <= config.gridCols; col += 5) {
      const x = offsetX + col * cellW;
      this.gridGraphics.moveTo(x, offsetY).lineTo(x, offsetY + totalH);
    }

    for (let row = 0; row <= config.gridRows; row += 5) {
      const y = offsetY + row * cellH;
      this.gridGraphics.moveTo(offsetX, y).lineTo(offsetX + totalW, y);
    }

    this.gridGraphics.stroke();
  }

  setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
