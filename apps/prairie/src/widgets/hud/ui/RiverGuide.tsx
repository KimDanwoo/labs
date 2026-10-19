'use client';

import { useRideRiver } from '@shared/r3f';

const BEARING = {
  ahead: { label: '앞쪽', arrow: '↑' },
  behind: { label: '뒤쪽', arrow: '↓' },
  left: { label: '왼쪽', arrow: '←' },
  right: { label: '오른쪽', arrow: '→' },
} as const;

export function RiverGuide() {
  const { riverDistance, riverBearing } = useRideRiver();
  const isCrossing = riverBearing === 'crossing';

  return (
    <div className="flex items-center gap-sm rounded-2xl border border-prairie-paper/20 bg-prairie-ink/35 px-md py-md backdrop-blur-md sm:gap-md sm:px-lg">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-6 shrink-0 text-prairie-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M2 7c3-4 5 4 8 0s5 4 8 0 4 0 4 0M2 12c3-4 5 4 8 0s5 4 8 0 4 0 4 0M2 17c3-4 5 4 8 0s5 4 8 0 4 0 4 0" />
      </svg>
      <div>
        <p className="text-xs text-prairie-paper/70">{isCrossing ? '물결 사이를 지나는 중' : '가까운 강까지'}</p>
        <p className="flex items-baseline gap-sm text-sm">
          {isCrossing ? (
            <span>강을 건너는 중</span>
          ) : (
            <>
              <span className="font-mono text-lg tabular-nums">
                {riverDistance}
                <span className="ml-xs text-xs text-prairie-paper/70">m</span>
              </span>
              <span className="text-prairie-accent">
                {BEARING[riverBearing].arrow} <span className="text-xs">{BEARING[riverBearing].label}</span>
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
