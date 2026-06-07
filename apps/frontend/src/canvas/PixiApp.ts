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
    background: '#0a0a0a',
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    powerPreference: 'high-performance',
  });

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
