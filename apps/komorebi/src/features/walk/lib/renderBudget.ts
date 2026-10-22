const MAX_RENDER_PIXELS = 2_400_000;
const FRAME_INTERVAL = 1000 / 30;

/** Bound GPU work independently of CSS size and display density. */
export function renderPixelRatio(width: number, height: number, deviceRatio: number, touch: boolean) {
  return Math.min(deviceRatio, touch ? 1.5 : 2, Math.sqrt(MAX_RENDER_PIXELS / Math.max(1, width * height)));
}

/** Active movement uses every display frame; idle scenery uses 30 Hz. */
export function shouldRenderFrame(time: number, scheduled: number, active: boolean) {
  return active || time + 0.1 >= scheduled;
}

export function nextRenderTime(time: number, scheduled: number) {
  return time + FRAME_INTERVAL - ((time - scheduled) % FRAME_INTERVAL);
}
