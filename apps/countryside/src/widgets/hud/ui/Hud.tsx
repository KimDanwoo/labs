'use client';

import { useRideSpeed } from '@shared/r3f';
import { KeyCap } from './KeyCap';

export function Hud() {
  const speedKmh = useRideSpeed();

  return (
    <div className="pointer-events-none absolute inset-0 flex items-end justify-between p-lg">
      <div className="rounded-lg bg-background/65 px-lg py-md text-foreground shadow-glow backdrop-blur-md">
        <div className="flex items-baseline gap-sm">
          <span className="text-4xl font-bold tabular-nums tracking-tight">{speedKmh}</span>
          <span className="text-sm text-muted">km/h</span>
        </div>
        <p className="text-xs text-muted">속도</p>
      </div>

      <div className="rounded-lg bg-background/65 px-lg py-md text-foreground shadow-glow backdrop-blur-md">
        <div className="flex flex-col gap-sm text-sm">
          <div className="flex items-center gap-sm">
            <KeyCap>W</KeyCap>
            <KeyCap>↑</KeyCap>
            <span className="text-muted">가속</span>
          </div>
          <div className="flex items-center gap-sm">
            <KeyCap>S</KeyCap>
            <KeyCap>↓</KeyCap>
            <span className="text-muted">감속 · 후진</span>
          </div>
          <div className="flex items-center gap-sm">
            <KeyCap>A</KeyCap>
            <KeyCap>D</KeyCap>
            <span className="text-muted">조향</span>
          </div>
        </div>
      </div>
    </div>
  );
}
