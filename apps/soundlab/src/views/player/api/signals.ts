import { REQUEST_TIMEOUT_MS, SIGNAL_DURATION_TOLERANCE_MS } from '@views/player/config/network';
import { parseBandSignals, parseWaveform } from '@views/player/lib/signals';

export async function fetchWaveform(url: string): Promise<Float32Array> {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`파형 요청 실패: ${response.status}`);
  return parseWaveform(await response.json());
}

const decodeBand = (base64: string) => {
  const binary = atob(base64);
  const out = new Float32Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i) / 255;
  return out;
};

let manifest: Promise<Set<number>> | null = null;

function fetchSignalManifest(): Promise<Set<number>> {
  manifest ??= fetch('/signals/index.json', { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
    .then(async (response): Promise<unknown> => (response.ok ? response.json() : []))
    .then(
      (ids) =>
        new Set<number>(
          Array.isArray(ids)
            ? ids.filter((id): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id > 0)
            : [],
        ),
    )
    .catch(() => new Set<number>());
  return manifest;
}

export async function fetchBands(trackId: number, durationMs: number) {
  if (!(await fetchSignalManifest()).has(trackId)) return null;
  const response = await fetch(`/signals/${trackId}.json`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) return null;
  const raw = parseBandSignals(await response.json());
  if (!raw) return null;
  if (Math.abs(raw.audioMs - durationMs) > SIGNAL_DURATION_TOLERANCE_MS) return null;
  return {
    fps: raw.fps,
    low: decodeBand(raw.low),
    mid: decodeBand(raw.mid),
    high: decodeBand(raw.high),
    beats: raw.beats,
  };
}
