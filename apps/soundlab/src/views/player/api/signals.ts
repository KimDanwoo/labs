import { parseBandSignals, parseWaveform } from '../lib/signals';

export async function fetchWaveform(url: string): Promise<Float32Array> {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`파형 요청 실패: ${response.status}`);
  return parseWaveform(await response.json());
}

/**
 * scripts/analyze-audio.mjs가 구운 대역 신호. 곡마다 있을 수도 없을 수도 있다 —
 * 없으면 앱은 사클 파형 폴백으로 돈다(신호가 있는 곡만 확장 시각).
 * 대역은 Uint8을 base64로 담는다(43Hz × 3채널을 평문 배열로 두면 3배가 된다).
 */
const decodeBand = (base64: string) => {
  const binary = atob(base64);
  const out = new Float32Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i) / 255;
  return out;
};

let manifest: Promise<Set<number>> | null = null;

function fetchSignalManifest(): Promise<Set<number>> {
  manifest ??= fetch('/signals/index.json', { signal: AbortSignal.timeout(10_000) })
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
  const response = await fetch(`/signals/${trackId}.json`, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) return null;
  const raw = parseBandSignals(await response.json());
  if (!raw || Math.abs(raw.audioMs - durationMs) > 250) return null;
  return {
    fps: raw.fps,
    low: decodeBand(raw.low),
    mid: decodeBand(raw.mid),
    high: decodeBand(raw.high),
    beats: raw.beats,
  };
}
