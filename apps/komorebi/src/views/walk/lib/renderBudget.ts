const MAX_RENDER_PIXELS = 2_400_000;
/** Frames per second while something moves, and for the gently animated scenery at rest. */
export const RENDER_RATE = { active: 60, idle: 30 } as const;

/** Bound GPU work independently of CSS size and display density. */
export function renderPixelRatio(width: number, height: number, deviceRatio: number, touch: boolean) {
  return Math.min(deviceRatio, touch ? 1.5 : 2, Math.sqrt(MAX_RENDER_PIXELS / Math.max(1, width * height)));
}

/** A quarter-frame tolerance absorbs requestAnimationFrame jitter without dropping a frame the display can show. */
export function shouldRenderFrame(time: number, scheduled: number, rate: number) {
  return time >= scheduled - 1000 / rate / 4;
}

/** Next slot on a fixed grid, so late frames do not accumulate drift. */
export function nextRenderTime(time: number, scheduled: number, rate: number) {
  const interval = 1000 / rate;
  if (time - scheduled > interval) return time + interval;
  return scheduled + interval;
}

/** Damped values approach but never reach their target; snap once the gap is invisible. */
export function settle(current: number, target: number, epsilon: number) {
  return Math.abs(current - target) <= epsilon ? target : current;
}
