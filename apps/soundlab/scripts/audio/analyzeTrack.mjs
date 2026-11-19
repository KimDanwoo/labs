import { FPS, SAMPLE_RATE, decodeMono, detectOnsets, normalize, spectra, toBase64 } from './dsp.mjs';
import { GRID_MIN_CONFIDENCE, findGrid } from './grid.mjs';

/**
 * 로컬 파일과 사클 스트리밍본의 길이 차 허용치. 넘으면 다른 마스터로 보고 신호를 굽지 않는다.
 *
 * 리마스터를 올렸으면 로컬 파일이 그 마스터가 아니고, 그러면 신호가 엉뚱한 박에 뛴다 —
 * 1.6% 길이 차이만으로 비트 격자가 3~4초마다 허용 오차(±60ms)를 넘는다. 없는 게 틀린 것보다 낫다.
 *
 * 근거(사클 파형 1800샘플과 로컬 피크 엔벨로프 상관으로 측정):
 * 같은 마스터인 `녹아`·`장마`는 길이 차 0.0초 · 최적 오프셋 0ms · 상관 0.65/0.70.
 * 리마스터가 올라간 `Neon Sign`은 길이 차 3.4초 · 오프셋 -125ms · 상관 0.54이고,
 * 길이 비율로 늘여 맞추면 0.33으로 더 나빠졌다(템포가 아니라 편집이 다르다).
 * 상관값은 0.54 대 0.65로 여유가 좁아 문턱으로 쓰지 않고, 여유가 큰 길이로 막는다.
 * mp3 인코더 패딩(수십 ms)은 흡수하되 실제 편집 차이는 걸리는 값이다.
 */
const MASTER_DRIFT_MS = 250;

export function analyze(file, track) {
  const pcm = decodeMono(file);
  const audioMs = (pcm.length / SAMPLE_RATE) * 1000;
  const drift = audioMs - track.durationMs;
  if (Math.abs(drift) > MASTER_DRIFT_MS) {
    return { mismatch: Math.round(drift) };
  }
  const { frames, bands, flux } = spectra(pcm);
  if (frames === 0) throw new Error('프레임이 없습니다(너무 짧은 파일)');

  const [low, mid, high] = bands.map(normalize);
  const onsets = detectOnsets(flux);
  const grid = findGrid(onsets, audioMs);
  const useGrid = grid && grid.confidence >= GRID_MIN_CONFIDENCE;

  return {
    payload: {
      id: track.id,
      fps: Number(FPS.toFixed(4)),
      // 신호는 절대 시각으로 인덱싱한다. 파일과 스트리밍본의 길이가 달라도 시작이 어긋나지 않는다.
      audioMs: Math.round(audioMs),
      low: toBase64(low),
      mid: toBase64(mid),
      high: toBase64(high),
      bpm: useGrid ? grid.bpm : null,
      beats: useGrid ? grid.beats : [],
    },
    report: {
      frames,
      audioMs,
      onsets: onsets.length,
      bpm: grid?.bpm ?? null,
      subdivision: grid?.subdivision ?? 1,
      confidence: grid?.confidence ?? 0,
      beats: useGrid ? grid.beats.length : 0,
      drift: Math.round(audioMs - track.durationMs),
    },
  };
}
