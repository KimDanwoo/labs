'use client';

import { useRideSpeed } from '@shared/r3f';
import { KeyCap } from './KeyCap';

export function Hud() {
  const speedKmh = useRideSpeed();

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-lg">
      <div className="self-start rounded-lg bg-background/65 px-lg py-md text-foreground shadow-glow backdrop-blur-md">
        <div className="flex items-baseline gap-sm">
          <span className="text-4xl font-bold tabular-nums tracking-tight">{speedKmh}</span>
          <span className="text-sm text-muted-foreground">km/h</span>
        </div>
        <p className="text-xs text-muted-foreground">속도</p>
      </div>

      {/* 키보드 안내는 터치 기기에선 의미가 없어 fine 포인터(데스크톱)에서만 노출. 모바일은 터치 컨트롤이 대체. */}
      <div className="hidden self-end rounded-lg bg-background/65 px-lg py-md text-foreground shadow-glow backdrop-blur-md pointer-fine:block">
        <div className="flex flex-col gap-sm text-sm">
          <div className="flex items-center gap-sm">
            <KeyCap>W</KeyCap>
            <KeyCap>↑</KeyCap>
            <span className="text-muted-foreground">가속</span>
          </div>
          <div className="flex items-center gap-sm">
            <KeyCap>S</KeyCap>
            <KeyCap>↓</KeyCap>
            <span className="text-muted-foreground">감속 · 후진</span>
          </div>
          <div className="flex items-center gap-sm">
            <KeyCap>A</KeyCap>
            <KeyCap>D</KeyCap>
            <span className="text-muted-foreground">조향</span>
          </div>
          <div className="flex items-center gap-sm">
            <KeyCap>드래그</KeyCap>
            <span className="text-muted-foreground">시점 이동</span>
          </div>
        </div>
      </div>
    </div>
  );
}
