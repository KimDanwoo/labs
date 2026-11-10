'use client';

import { useRideTelemetry } from '../../model/ride-state/rideTelemetry';

export function RideTelemetry() {
  const { speed, altitude } = useRideTelemetry();
  let message = '초원에 머무는 중';
  if (speed > 0) message = '초원을 달리는 중';
  if (altitude > 0) message = '하늘을 나는 중';
  return (
    <div
      aria-label="주행 상태"
      className="flex items-center gap-md self-start rounded-full bg-prairie-ink/60 px-md py-xs text-xs text-prairie-paper/80 backdrop-blur-md"
    >
      <span className="flex items-baseline gap-xs">
        <output aria-label="현재 속도" className="font-mono text-lg tabular-nums text-prairie-paper">
          {speed}
        </output>
        <span>km/h</span>
      </span>
      <span aria-hidden className="h-3 border-l border-prairie-paper/30" />
      <span>{message}</span>
      {altitude > 0 && (
        <span className="font-mono">
          <output aria-label="비행 높이">{altitude}</output> m
        </span>
      )}
    </div>
  );
}
