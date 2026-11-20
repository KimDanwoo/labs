import { createRenderer, type Renderer } from '@views/player/lib/stage/renderer';

export function createRendererOrFallback(canvas: HTMLCanvasElement): Renderer | null {
  try {
    return createRenderer(canvas);
  } catch {
    canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
}
