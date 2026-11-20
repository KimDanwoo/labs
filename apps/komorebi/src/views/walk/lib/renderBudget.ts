const MAX_RENDER_PIXELS = 2_400_000;
export const RENDER_RATE = { active: 60, idle: 30 } as const;

export function renderPixelRatio(width: number, height: number, deviceRatio: number, touch: boolean) {
  return Math.min(deviceRatio, touch ? 1.5 : 2, Math.sqrt(MAX_RENDER_PIXELS / Math.max(1, width * height)));
}

export function shouldRenderFrame(time: number, scheduled: number, rate: number) {
  return time >= scheduled - 1000 / rate / 4;
}

export function nextRenderTime(time: number, scheduled: number, rate: number) {
  const interval = 1000 / rate;
  if (time - scheduled > interval) return time + interval;
  return scheduled + interval;
}

export function settle(current: number, target: number, epsilon: number) {
  return Math.abs(current - target) <= epsilon ? target : current;
}
