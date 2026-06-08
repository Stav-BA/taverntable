import { Application, Assets } from 'pixi.js';

let pixiApp: Application | null = null;

export async function createPixiApp(canvas: HTMLCanvasElement): Promise<Application> {
  if (pixiApp) {
    await destroyPixiApp();
  }

  const app = new Application();

  await app.init({
    canvas,
    resizeTo: canvas.parentElement ?? canvas,
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    powerPreference: 'high-performance',
  });

  // Force transparent background — belt-and-suspenders for PixiJS 8
  app.renderer.background.alpha = 0;
  // Make the DOM canvas element itself transparent via CSS too
  canvas.style.background = 'transparent';

  console.log('[TavernTable] PixiJS ready. BG alpha:', app.renderer.background.alpha);

  pixiApp = app;
  return app;
}

export async function destroyPixiApp(): Promise<void> {
  if (pixiApp) {
    pixiApp.destroy(false, { children: true, texture: true });
    pixiApp = null;
  }
}

export function getPixiApp(): Application | null {
  return pixiApp;
}
