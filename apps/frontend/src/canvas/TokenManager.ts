import {
  Application,
  Container,
  Graphics,
  Text,
  FederatedPointerEvent,
  Assets,
  Sprite,
  Texture,
} from 'pixi.js';
import type { Token, MapConfig } from '@/stores/gameStore';

interface TokenSprite {
  container: Container;
  base: Graphics;
  hpBar: Graphics;
  hpBarBg: Graphics;
  nameLabel: Text;
  conditionRing: Graphics;
  tokenId: string;
}

type OnDragEnd = (tokenId: string, gridX: number, gridY: number) => void;
type OnTokenClick = (tokenId: string) => void;

export class TokenManager {
  private container: Container;
  private tokenSprites: Map<string, TokenSprite> = new Map();
  private dragging: { sprite: TokenSprite; startX: number; startY: number } | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  constructor(
    private app: Application,
    private onDragEnd: OnDragEnd,
    private onTokenClick: OnTokenClick
  ) {
    this.container = new Container();
    this.container.label = 'token-layer';
  }

  attachToStage(index: number): void {
    this.app.stage.addChildAt(this.container, index);
  }

  syncTokens(
    tokens: Token[],
    config: MapConfig,
    currentPlayerId: string,
    isDM: boolean
  ): void {
    const existingIds = new Set(this.tokenSprites.keys());

    for (const token of tokens) {
      if (!token.isVisible && !isDM) continue;

      existingIds.delete(token.id);

      if (this.tokenSprites.has(token.id)) {
        this.updateTokenSprite(token, config);
      } else {
        this.createTokenSprite(token, config, currentPlayerId, isDM);
      }
    }

    // Remove stale sprites
    for (const id of existingIds) {
      const sprite = this.tokenSprites.get(id);
      if (sprite) {
        this.container.removeChild(sprite.container);
        sprite.container.destroy({ children: true });
        this.tokenSprites.delete(id);
      }
    }
  }

  private getStagePos(
    gridX: number,
    gridY: number,
    config: MapConfig
  ): { x: number; y: number } {
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

  private getCellSize(config: MapConfig): number {
    const stageW = this.app.screen.width;
    const stageH = this.app.screen.height;
    const mapW = config.gridCols * config.gridSizePx;
    const mapH = config.gridRows * config.gridSizePx;
    const scale = Math.min(stageW / mapW, stageH / mapH);
    return config.gridSizePx * scale;
  }

  private stageToGrid(
    stageX: number,
    stageY: number,
    config: MapConfig
  ): { col: number; row: number } {
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
      col: Math.max(0, Math.min(config.gridCols - 1, Math.floor((stageX - offsetX) / cellW))),
      row: Math.max(0, Math.min(config.gridRows - 1, Math.floor((stageY - offsetY) / cellH))),
    };
  }

  private createTokenSprite(
    token: Token,
    config: MapConfig,
    currentPlayerId: string,
    isDM: boolean
  ): void {
    const cellSize = this.getCellSize(config);
    const radius = cellSize * 0.38;
    const pos = this.getStagePos(token.x, token.y, config);

    const tokenContainer = new Container();
    tokenContainer.label = `token-${token.id}`;
    tokenContainer.x = pos.x;
    tokenContainer.y = pos.y;

    // HP bar background
    const hpBarBg = new Graphics();
    hpBarBg.rect(-radius, -radius - 10, radius * 2, 6).fill({ color: 0x1a1a1a });
    tokenContainer.addChild(hpBarBg);

    // HP bar fill
    const hpBar = new Graphics();
    tokenContainer.addChild(hpBar);
    this.drawHpBar(hpBar, token.hp, token.maxHp, radius);

    // Condition ring (coloured ring for conditions)
    const conditionRing = new Graphics();
    tokenContainer.addChild(conditionRing);

    // Base circle (colour ring)
    const base = new Graphics();
    const colourHex = parseInt(token.colour.replace('#', ''), 16);
    base.circle(0, 0, radius + 3).fill({ color: colourHex });
    base.circle(0, 0, radius).fill({ color: 0x2a2a2a });

    // Inner fill (darker)
    base.circle(0, 0, radius - 3).fill({ color: 0x1a1a1a });

    tokenContainer.addChild(base);

    // Initial of name
    const initial = new Text({
      text: token.name.slice(0, 2).toUpperCase(),
      style: {
        fontFamily: 'Cinzel',
        fontSize: Math.max(10, radius * 0.7),
        fill: token.colour,
        fontWeight: 'bold',
        align: 'center',
      },
    });
    initial.anchor.set(0.5);
    tokenContainer.addChild(initial);

    // Name label below
    const nameLabel = new Text({
      text: token.name,
      style: {
        fontFamily: 'Crimson Text',
        fontSize: 11,
        fill: 0xf4e4bc,
        align: 'center',
        dropShadow: {
          color: 0x000000,
          blur: 4,
          distance: 1,
        },
      },
    });
    nameLabel.anchor.set(0.5, 0);
    nameLabel.y = radius + 6;
    tokenContainer.addChild(nameLabel);

    // Interactivity
    const canDrag = isDM || token.playerId === currentPlayerId;
    if (canDrag) {
      tokenContainer.eventMode = 'static';
      tokenContainer.cursor = 'grab';

      tokenContainer.on('pointerdown', (e: FederatedPointerEvent) => {
        e.stopPropagation();
        const ts: TokenSprite = {
          container: tokenContainer,
          base,
          hpBar,
          hpBarBg,
          nameLabel,
          conditionRing,
          tokenId: token.id,
        };
        this.dragging = {
          sprite: ts,
          startX: tokenContainer.x,
          startY: tokenContainer.y,
        };
        this.dragOffsetX = e.globalX - tokenContainer.x;
        this.dragOffsetY = e.globalY - tokenContainer.y;
        tokenContainer.cursor = 'grabbing';
        tokenContainer.alpha = 0.7;

        const onMove = (ev: FederatedPointerEvent) => {
          if (!this.dragging) return;
          tokenContainer.x = ev.globalX - this.dragOffsetX;
          tokenContainer.y = ev.globalY - this.dragOffsetY;
        };

        const onUp = (ev: FederatedPointerEvent) => {
          if (!this.dragging) return;
          tokenContainer.cursor = 'grab';
          tokenContainer.alpha = 1;

          const { col, row } = this.stageToGrid(tokenContainer.x, tokenContainer.y, config);
          this.onDragEnd(token.id, col, row);

          this.dragging = null;
          this.app.stage.off('pointermove', onMove);
          this.app.stage.off('pointerup', onUp);
        };

        this.app.stage.on('pointermove', onMove);
        this.app.stage.on('pointerup', onUp);
      });

      tokenContainer.on('pointertap', () => {
        this.onTokenClick(token.id);
      });
    }

    this.container.addChild(tokenContainer);
    this.tokenSprites.set(token.id, {
      container: tokenContainer,
      base,
      hpBar,
      hpBarBg,
      nameLabel,
      conditionRing,
      tokenId: token.id,
    });
  }

  private updateTokenSprite(token: Token, config: MapConfig): void {
    const ts = this.tokenSprites.get(token.id);
    if (!ts) return;

    const pos = this.getStagePos(token.x, token.y, config);
    if (ts.container.x !== pos.x || ts.container.y !== pos.y) {
      ts.container.x = pos.x;
      ts.container.y = pos.y;
    }

    const radius = this.getCellSize(config) * 0.38;
    this.drawHpBar(ts.hpBar, token.hp, token.maxHp, radius);
    ts.nameLabel.text = token.name;
  }

  private drawHpBar(gfx: Graphics, hp: number, maxHp: number, radius: number): void {
    gfx.clear();
    if (maxHp <= 0) return;

    const pct = Math.max(0, Math.min(1, hp / maxHp));
    const barW = radius * 2;
    const barH = 5;
    const barX = -radius;
    const barY = -radius - 10;

    // Background
    gfx.rect(barX, barY, barW, barH).fill({ color: 0x1a1a1a });

    // Fill
    const fillColour =
      pct > 0.6 ? 0x2d8a2d : pct > 0.3 ? 0xc9a227 : 0x8b1a1a;
    gfx.rect(barX, barY, barW * pct, barH).fill({ color: fillColour });
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy({ children: true });
    this.tokenSprites.clear();
  }
}
