'use client';

import { useRideRiver } from '@shared/r3f';
import { KeyCap } from './KeyCap';

// 강까지의 방향 안내. 강은 안개(FOG.far) 밖에선 보이지 않아 화면 표시가 유일한 길잡이다.
const BEARING_LABEL = {
  ahead: '↑ 앞',
  behind: '↓ 뒤',
  left: '← 왼쪽',
  right: '→ 오른쪽',
} as const;

export function Hud() {
  const { riverDistance, riverBearing } = useRideRiver();
  const isCrossing = riverBearing === 'crossing';

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-lg">
      <div className="self-start rounded-lg bg-background/65 px-lg py-md text-foreground shadow-glow backdrop-blur-md">
        {isCrossing ? (
          <p className="text-lg font-semibold">강을 건너는 중</p>
        ) : (
          <div className="flex items-baseline gap-sm">
            <span className="text-lg font-semibold">{BEARING_LABEL[riverBearing]}</span>
            <span className="text-4xl font-bold tabular-nums tracking-tight">{riverDistance}</span>
            <span className="text-sm text-muted-foreground">m</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">강</p>
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
            <KeyCap>Shift</KeyCap>
            <span className="text-muted-foreground">질주 · 돌풍</span>
          </div>
          <div className="flex items-center gap-sm">
            <KeyCap>Space</KeyCap>
            <span className="text-muted-foreground">점프 · 누르면 비행</span>
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
