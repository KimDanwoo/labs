/**
 * 위젯 위치 보고의 지터 흡수. 보고값을 그대로 좇으면 시계가 앞뒤로 잔튀고 비트 격자가 같이 튄다.
 * 프레임당 보정을 경과시간의 이 비율로 묶어 단조로 흘리고, 문턱을 넘는 차이는 시킹으로 보고 점프한다.
 */
const DRIFT_CORRECT_RATIO = 0.3;
const DRIFT_SNAP_MS = 250;

/** 재생 중 위치 보고가 이보다 오래 끊기면 시계 전진을 세운다 — 소리는 멈췄는데 진행바만 달리지 않게. */
const STALL_MS = 3000;

export type PositionReport = { ms: number; at: number; live: boolean };

export const estimatePosition = ({ ms, at, live }: PositionReport, isPlaying: boolean, now: number): number =>
  live && isPlaying ? ms + Math.min(STALL_MS, now - at) : ms;

type ClockFrame = {
  smoothMs: number;
  delta: number;
  report: PositionReport;
  isPlaying: boolean;
  now: number;
};

export function advanceClock({ smoothMs, delta, report, isPlaying, now }: ClockFrame): number {
  if (!(isPlaying && report.live)) return report.ms;

  const target = estimatePosition(report, isPlaying, now);
  const drift = target - (smoothMs + delta);
  if (Math.abs(drift) > DRIFT_SNAP_MS) return target;

  const bound = delta * DRIFT_CORRECT_RATIO;
  return smoothMs + delta + Math.min(bound, Math.max(-bound, drift));
}
