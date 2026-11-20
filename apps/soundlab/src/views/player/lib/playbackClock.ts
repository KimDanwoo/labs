const DRIFT_CORRECT_RATIO = 0.3;
const DRIFT_SNAP_MS = 250;

const STALL_MS = 3000;

export type PositionReport = { ms: number; at: number; live: boolean };

export const estimatePosition = ({ ms, at, live }: PositionReport, isPlaying: boolean, now: number): number => {
  const isAdvancing = live && isPlaying;
  return isAdvancing ? ms + Math.min(STALL_MS, now - at) : ms;
};

type ClockFrame = {
  smoothMs: number;
  delta: number;
  report: PositionReport;
  isPlaying: boolean;
  now: number;
};

export function advanceClock({ smoothMs, delta, report, isPlaying, now }: ClockFrame): number {
  const isLivePlayback = isPlaying && report.live;
  if (!isLivePlayback) return report.ms;

  const target = estimatePosition(report, isPlaying, now);
  const drift = target - (smoothMs + delta);
  if (Math.abs(drift) > DRIFT_SNAP_MS) return target;

  const bound = delta * DRIFT_CORRECT_RATIO;
  return smoothMs + delta + Math.min(bound, Math.max(-bound, drift));
}
