import { closedCurve } from '@views/drive/lib/engine/game/world/layout/curves';
import { type Point, TRACK } from '@views/drive/lib/engine/game/world/layout/islandLayout';

export interface TrackSample {
  readonly point: Point;
  readonly forward: Point;
  readonly distance: number;
}

const CURVE_SAMPLES = 24;

function resample(curve: readonly Point[], spacing: number): TrackSample[] {
  const samples: TrackSample[] = [];
  let travelled = 0;
  let next = 0;
  curve.forEach((from, index) => {
    const to = curve[(index + 1) % curve.length] ?? from;
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const forward: Point = [(to[0] - from[0]) / length, (to[1] - from[1]) / length];
    while (next <= travelled + length) {
      const t = (next - travelled) / length;
      samples.push({
        point: [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t],
        forward,
        distance: next,
      });
      next += spacing;
    }
    travelled += length;
  });
  return samples;
}

export function trackSamples(spacing: number): TrackSample[] {
  return resample(closedCurve(TRACK.centerline, CURVE_SAMPLES), spacing);
}

export function nearestSample(samples: readonly TrackSample[], [x, z]: Point): TrackSample {
  const nearest = samples.reduce<TrackSample | null>((best, sample) => {
    if (!best) return sample;
    const distance = Math.hypot(sample.point[0] - x, sample.point[1] - z);
    return distance < Math.hypot(best.point[0] - x, best.point[1] - z) ? sample : best;
  }, null);
  if (!nearest) throw new Error('트랙 샘플이 비어 있어요.');
  return nearest;
}

export function isOverWaterJump([x, z]: Point): boolean {
  const { from, to } = TRACK.waterJump;
  return (
    x > Math.min(from[0], to[0]) &&
    x < Math.max(from[0], to[0]) &&
    z > Math.min(from[1], to[1]) &&
    z < Math.max(from[1], to[1])
  );
}

export const sideOf = ([x, z]: Point): Point => [-z, x];
