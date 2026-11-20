import type { Track } from '@entities/track';
import { fetchBands, fetchWaveform } from '@views/player/api/signals';
import { deriveSignals, type Signals, withDerived } from '@views/player/lib/waveformSignals';

export const cache = new Map<number, Signals>();
const inFlight = new Map<number, Promise<void>>();

async function load(track: Track): Promise<Signals> {
  const bands = await fetchBands(track.id, track.durationMs).catch(() => null);
  if (bands) {
    return withDerived(bands.mid, bands.fps, { bass: bands.low, air: bands.high, beats: bands.beats });
  }
  return deriveSignals(await fetchWaveform(track.waveformUrl), track.durationMs);
}
export function warm(track: Track | undefined): Promise<void> {
  if (!track || cache.has(track.id)) return Promise.resolve();
  const existing = inFlight.get(track.id);
  if (existing) return existing;

  const loading = load(track)
    .then((signals) => {
      cache.set(track.id, signals);
    })
    .catch(() => undefined)
    .finally(() => inFlight.delete(track.id));

  inFlight.set(track.id, loading);
  return loading;
}
