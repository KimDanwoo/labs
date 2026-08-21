#!/usr/bin/env node
// 원곡 오디오에서 시각 신호를 뽑아 public/signals/{id}.json 으로 굽는다.
//
// 사클이 주는 waveform_url은 진폭 하나를 8.6Hz로 준다. 그걸로는 대역을 나눌 수 없고 비트도 못 잡는다.
// 원곡을 직접 읽으면 43Hz 3채널 + 비트 격자가 나온다(측정: 대역 간 상관 -0.004~0.29 = 거의 독립).
//
// 오디오는 웹에 올리지 않는다. 이 스크립트는 로컬에서만 돌고, 커밋되는 건 곡당 수십 KB의 신호다.
// 재생은 계속 SoundCloud 위젯이 한다.
//
// 사용: node scripts/analyze-audio.mjs <오디오폴더>
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TRACKS_FILE = join(HERE, '..', 'src', 'entities', 'track', 'model', 'constants', 'tracks.ts');
const OUT_DIR = join(HERE, '..', 'public', 'signals');
const TMP = join(HERE, '..', 'node_modules', '.cache', 'soundlab-pcm.raw');

const SAMPLE_RATE = 22050;
const FFT_SIZE = 1024;
const HOP = 512; // 43.07Hz — 킥을 23ms 안에 집을 수 있고, 사클 파형의 5배다
const FPS = SAMPLE_RATE / HOP;

/** 대역 경계(Hz). 저역=킥·베이스, 중역=보컬·스네어·기타, 고역=하이햇·공기감. */
const BAND_EDGES = [
  [20, 200],
  [200, 4000],
  [4000, SAMPLE_RATE / 2],
];

/** 비트 격자 탐색 범위와 허용 오차. 격자에 붙은 온셋 비율이 신뢰도가 된다. */
const BPM_MIN = 60;
const BPM_MAX = 180;
const BPM_STEP = 0.25;
/**
 * 격자 세분. 킥은 박에만 오지 않는다 — 실측: `네온사인`의 온셋 간격이 0.60/0.30/0.15s(4·8·16분음표)였다.
 * 박 간격만 놓고 점수를 내면 16분음표 온셋이 다 빗나가 신뢰도가 실제보다 낮게 나온다.
 */
const SUBDIVISIONS = [1, 2, 4];
/** 격자선 허용 오차. 간격에 비례하되 프레임 양자화(23ms)보다는 넉넉해야 한다. */
const GRID_TOLERANCE_MS = 60;
const GRID_TOLERANCE_MIN_MS = 25;
const GRID_TOLERANCE_RATIO = 0.15;
/** 이 비율 아래면 비트를 내보내지 않는다 — 억지로 켜면 스터터가 된다(PRD §6). */
const GRID_MIN_CONFIDENCE = 0.75;

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

/** 제목이 다른 경우의 수동 대응표. 사클 제목 ← 파일명(확장자 제외). */
const TITLE_ALIAS = { 네온사인: 'Neon Sign', '네가 만든 Scene': 'Scene' };

const AUDIO_EXT = new Set(['.mp3', '.wav', '.m4a', '.flac', '.aiff', '.aif', '.ogg']);

/**
 * 파일명 꼬리의 버전 표기. 같은 곡의 마스터가 여러 개 있을 수 있어(리마스터를 올린 곡이 있다)
 * 표기를 떼고 같은 곡으로 묶은 뒤, 어느 파일을 쓸지는 길이로 고른다.
 */
const VERSION_TAG =
  /[\s_-]*[([{]?\s*(remaster(ed)?|리마스터|master(ing)?|마스터링|final|fin|vers?on\s*\d*|version\s*\d*|v\d+|\d{1,2})\s*[)\]}]?$/gi;

const normalizeStem = (stem) => {
  let out = stem.trim();
  let previous;
  // 표기가 겹쳐 붙은 경우(`곡 remaster v2`)도 벗긴다.
  do {
    previous = out;
    out = out.replace(VERSION_TAG, '').trim();
  } while (out !== previous && out.length > 0);
  return out || stem.trim();
};

/**
 * 곡을 묶는 열쇠. 파일명과 사클 제목의 표기가 자주 다르다 —
 * 파일은 `걸어.mp3`인데 사클 제목은 `걸어 (Walk Through Neon Rain)`이고, `low tide`와 `Low tide`처럼
 * 대소문자만 다르기도 하다. 괄호 부제·버전 표기·공백·문장부호를 다 지우고 비교한다.
 * 열쇠가 겹치는 곡이 있으면 길이로 가른다.
 */
const titleKey = (value) =>
  normalizeStem(String(value).normalize('NFC'))
    .replace(/[([{][^)\]}]*[)\]}]/g, '')
    .toLowerCase()
    .replace(/[\s_\-–—.,!?'"·]/g, '');

/** 같은 곡의 파일이 여럿이고 길이도 같을 때의 우선순위. 리마스터를 올렸다는 게 사용자의 규칙이다. */
const versionRank = (stem) => (/remaster|리마스터/i.test(stem) ? 2 : /v\d|verson|version|\d$/i.test(stem) ? 1 : 0);
/** 이 차이 안이면 길이로는 못 가른다고 보고 위 우선순위로 넘긴다. */
const DRIFT_TIE_MS = 150;

/** 디코드는 곡당 1초쯤 걸린다. 후보를 고를 때는 길이만 빠르게 묻는다. */
function probeDurationMs(file) {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
    { encoding: 'utf8' },
  );
  const seconds = Number.parseFloat(out.trim());
  return Number.isFinite(seconds) ? seconds * 1000 : Number.NaN;
}

function parseTracks() {
  const src = readFileSync(TRACKS_FILE, 'utf8');
  return src
    .split(/\n {2}\{/)
    .slice(1)
    .map((block) => ({
      id: Number(block.match(/id: (\d+)/)?.[1]),
      title: block.match(/title: '((?:[^'\\]|\\.)*)'/)?.[1]?.replace(/\\'/g, "'"),
      durationMs: Number(block.match(/durationMs: (\d+)/)?.[1]),
    }))
    .filter((track) => track.id && track.title);
}

function decodeMono(file) {
  mkdirSync(dirname(TMP), { recursive: true });
  execFileSync(
    'ffmpeg',
    ['-v', 'error', '-i', file, '-map', '0:a:0', '-ac', '1', '-ar', String(SAMPLE_RATE), '-f', 'f32le', TMP, '-y'],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
  const buffer = readFileSync(TMP);
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
}

// --- 반복형 radix-2 FFT. 프레임마다 도니 테이블은 한 번만 만든다.
const reverse = new Uint32Array(FFT_SIZE);
for (let i = 0, bits = Math.log2(FFT_SIZE); i < FFT_SIZE; i++) {
  let r = 0;
  for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
  reverse[i] = r;
}
const twiddleCos = new Float64Array(FFT_SIZE / 2);
const twiddleSin = new Float64Array(FFT_SIZE / 2);
for (let i = 0; i < FFT_SIZE / 2; i++) {
  twiddleCos[i] = Math.cos((-2 * Math.PI * i) / FFT_SIZE);
  twiddleSin[i] = Math.sin((-2 * Math.PI * i) / FFT_SIZE);
}
const window = Float64Array.from({ length: FFT_SIZE }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));

function fft(re, im) {
  for (let i = 0; i < FFT_SIZE; i++) {
    const j = reverse[i];
    if (j > i) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let size = 2; size <= FFT_SIZE; size <<= 1) {
    const half = size >> 1;
    const step = FFT_SIZE / size;
    for (let start = 0; start < FFT_SIZE; start += size) {
      for (let j = 0; j < half; j++) {
        const c = twiddleCos[j * step];
        const s = twiddleSin[j * step];
        const a = start + j;
        const b = a + half;
        const tr = re[b] * c - im[b] * s;
        const ti = re[b] * s + im[b] * c;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
    }
  }
}

const binOf = (hz) => Math.max(1, Math.round((hz / (SAMPLE_RATE / 2)) * (FFT_SIZE / 2)));

/** 대역별 에너지 엔벨로프와 저역 스펙트럼 플럭스(=킥 후보)를 한 번의 STFT로 뽑는다. */
function spectra(pcm) {
  const frames = Math.max(0, Math.floor((pcm.length - FFT_SIZE) / HOP));
  const bands = BAND_EDGES.map(() => new Float32Array(frames));
  const flux = new Float32Array(frames);
  const [lowFrom, lowTo] = [binOf(BAND_EDGES[0][0]), binOf(BAND_EDGES[0][1])];
  const edges = BAND_EDGES.map(([lo, hi]) => [binOf(lo), binOf(hi)]);

  const re = new Float64Array(FFT_SIZE);
  const im = new Float64Array(FFT_SIZE);
  let previous = new Float64Array(lowTo - lowFrom);

  for (let f = 0; f < frames; f++) {
    const offset = f * HOP;
    for (let i = 0; i < FFT_SIZE; i++) {
      re[i] = (pcm[offset + i] ?? 0) * window[i];
      im[i] = 0;
    }
    fft(re, im);

    edges.forEach(([from, to], band) => {
      let sum = 0;
      for (let k = from; k < to; k++) sum += re[k] * re[k] + im[k] * im[k];
      bands[band][f] = Math.sqrt(sum);
    });

    const current = new Float64Array(lowTo - lowFrom);
    let rise = 0;
    for (let k = lowFrom; k < lowTo; k++) {
      const mag = Math.hypot(re[k], im[k]);
      current[k - lowFrom] = mag;
      rise += Math.max(0, mag - previous[k - lowFrom]);
    }
    flux[f] = rise;
    previous = current;
  }
  return { frames, bands, flux };
}

/** 곡별 p95로 0–1로 편다. 마스터링된 트랙은 절대값이 곡마다 달라 그대로 쓰면 비교가 안 된다. */
function normalize(values) {
  const sorted = Float32Array.from(values).sort();
  const ceil = sorted[Math.floor(sorted.length * 0.95)] || 1;
  return Float32Array.from(values, (v) => Math.min(1, v / ceil));
}

/** 적응 임계로 플럭스 봉우리를 고른다. 이건 격자를 찾기 위한 증거일 뿐, 그대로 내보내지 않는다. */
function detectOnsets(flux) {
  const span = Math.round(FPS);
  const found = [];
  for (let f = 3; f < flux.length - 3; f++) {
    const from = Math.max(0, f - span);
    const to = Math.min(flux.length, f + span);
    let mean = 0;
    for (let i = from; i < to; i++) mean += flux[i];
    mean /= to - from;
    let variance = 0;
    for (let i = from; i < to; i++) variance += (flux[i] - mean) ** 2;
    const sd = Math.sqrt(variance / (to - from));
    const isPeak =
      flux[f] >= flux[f - 1] && flux[f] >= flux[f + 1] && flux[f] >= flux[f - 2] && flux[f] >= flux[f + 2];
    if (isPeak && flux[f] > mean + 1.3 * sd) {
      const ms = (f / FPS) * 1000;
      if (!found.length || ms - found.at(-1).ms > 90) found.push({ ms, strength: flux[f] });
    }
  }
  return found;
}

/**
 * 온셋에 가장 잘 맞는 등간격 격자를 찾는다. 온셋을 그대로 파동으로 쓰면 이중 발화·누락이 그대로 보이는데
 * (실측: `장마`에서 90ms 바닥에 43번 붙었다) 격자로 정규화하면 그게 사라진다.
 * 격자에 붙은 온셋 비율이 신뢰도이고, 낮으면 비트를 아예 내보내지 않는다.
 */
function findGrid(onsets, durationMs) {
  if (onsets.length < 16) return null;
  let best = null;

  for (let bpm = BPM_MIN; bpm <= BPM_MAX; bpm += BPM_STEP) {
    for (const subdivision of SUBDIVISIONS) {
      const period = 60_000 / bpm / subdivision;
      const tolerance = Math.min(GRID_TOLERANCE_MS, Math.max(GRID_TOLERANCE_MIN_MS, period * GRID_TOLERANCE_RATIO));
      // 격자가 잘면 아무 온셋이나 우연히 맞는다(180BPM ÷4는 우연 일치율이 60%다).
      // 기대치를 빼고 남는 만큼만 점수로 센다 — 세분이 달라도 값이 비교 가능해진다.
      const chance = Math.min(0.95, (2 * tolerance) / period);

      // 위상은 첫 온셋들을 후보로 삼는다 — 격자는 어딘가의 실제 타격에서 시작한다.
      for (const anchor of onsets.slice(0, 24)) {
        let matched = 0;
        for (const onset of onsets) {
          const offset = (((onset.ms - anchor.ms) % period) + period) % period;
          if (Math.min(offset, period - offset) <= tolerance) matched++;
        }
        const score = (matched / onsets.length - chance) / (1 - chance);
        if (!best || score > best.score) {
          best = { bpm, subdivision, period, phase: anchor.ms % period, matched, score };
        }
      }
    }
  }
  if (!best) return null;

  // 신뢰도도 우연 보정된 점수를 쓴다 — 원시 일치율은 잘게 쪼갤수록 부풀려진다.
  const confidence = Math.max(0, best.score);
  // 격자선마다 근처 온셋의 세기를 붙인다. 온셋이 없는 격자선은 0 — 쉬는 박은 조용해야 한다.
  const tolerance = Math.min(GRID_TOLERANCE_MS, Math.max(GRID_TOLERANCE_MIN_MS, best.period * GRID_TOLERANCE_RATIO));
  const peak = Math.max(...onsets.map((onset) => onset.strength)) || 1;
  // 세기 0인 격자선은 내보내지 않는다 — 펄스를 안 만들면서 파일만 키운다(실측: 격자선의 66~82%).
  const beats = [];
  for (let ms = best.phase; ms < durationMs; ms += best.period) {
    const near = onsets.find((onset) => Math.abs(onset.ms - ms) <= tolerance);
    if (!near) continue;
    beats.push([Math.round(ms), Math.round((near.strength / peak) * 255)]);
  }
  return { bpm: best.bpm, subdivision: best.subdivision, confidence, beats };
}

const toBase64 = (values) => Buffer.from(Uint8Array.from(values, (v) => Math.round(v * 255))).toString('base64');

function analyze(file, track) {
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

/**
 * 격자 탐색 자체 검증. `node scripts/analyze-audio.mjs --selftest`
 * 오디오 없이 도는 유일한 검증 지점이라 여기 둔다 — 격자를 잘못 잡으면 화면이 엉뚱한 박에 뛴다.
 */
function selftest() {
  const check = (label, ok, detail) => {
    console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
    if (!ok) process.exitCode = 1;
  };

  // 1) 120BPM 16분음표(125ms) + 지터. 주기를 2% 안에서 복원해야 한다.
  const jitter = (seed) => ((Math.sin(seed * 12.9898) * 43758.5453) % 1) * 16 - 8;
  const grid = Array.from({ length: 240 }, (_, i) => ({ ms: i * 125 + jitter(i), strength: 1 }));
  const found = findGrid(grid, 30_000);
  const period = found ? 60_000 / found.bpm / found.subdivision : 0;
  check('등간격 격자 복원', !!found && Math.abs(period - 125) / 125 < 0.02, `주기 ${period.toFixed(1)}ms (기대 125ms)`);
  check('신뢰도 높음', !!found && found.confidence > 0.9, `${((found?.confidence ?? 0) * 100).toFixed(0)}%`);

  // 2) 무작위 온셋은 격자가 아니다 — 신뢰도가 문턱 아래여야 비트를 안 내보낸다.
  let seed = 1;
  const random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const noise = [];
  for (let ms = 0; ms < 30_000; ms += 90 + random() * 400) noise.push({ ms, strength: 1 });
  const noisy = findGrid(noise, 30_000);
  check(
    '무작위는 격자로 인정 안 됨',
    !noisy || noisy.confidence < GRID_MIN_CONFIDENCE,
    `신뢰도 ${((noisy?.confidence ?? 0) * 100).toFixed(0)}% < ${GRID_MIN_CONFIDENCE * 100}%`,
  );

  // 3) 중간이 비어도(쉬는 구간) 격자는 유지되고, 빈 격자선은 내보내지 않는다.
  const gapped = grid.filter((onset) => onset.ms < 10_000 || onset.ms > 20_000);
  const withGap = findGrid(gapped, 30_000);
  const inGap = withGap?.beats.filter(([ms]) => ms > 11_000 && ms < 19_000).length ?? -1;
  check('쉬는 구간에는 비트를 안 만든다', inGap === 0, `구간 내 ${inGap}개`);

  // 4) 온셋이 너무 적으면 판단하지 않는다.
  check('증거 부족이면 null', findGrid(grid.slice(0, 8), 30_000) === null);
}

if (process.argv[2] === '--selftest') {
  selftest();
  process.exit();
}

const folder = process.argv[2];
if (!folder || !existsSync(folder)) {
  console.error('사용: node scripts/analyze-audio.mjs <오디오폴더> | --selftest');
  process.exit(1);
}

const tracks = parseTracks();
const byTitle = new Map(tracks.map((track) => [track.title, track]));
/** 곡별 하위 폴더로 정리된 경우가 많다. 아래까지 훑는다(파일명만 매칭에 쓰므로 깊이는 상관없다). */
function collectAudio(root, depth = 0) {
  if (depth > 4) return [];
  const out = [];
  for (const entry of readdirSync(root)) {
    if (entry.startsWith('.')) continue;
    const full = join(root, entry);
    if (statSync(full).isDirectory()) out.push(...collectAudio(full, depth + 1));
    else if (AUDIO_EXT.has(extname(entry).toLowerCase())) out.push(full);
  }
  return out;
}
const files = collectAudio(folder);

mkdirSync(OUT_DIR, { recursive: true });
const skipped = [];
const mismatched = [];

// 열쇠 하나에 곡이 여럿일 수 있어 배열로 담는다.
const byKey = new Map();
for (const track of tracks) {
  const key = titleKey(track.title);
  if (!byKey.has(key)) byKey.set(key, []);
  byKey.get(key).push(track);
}

const resolve = (stem, file) => {
  const direct = byTitle.get(TITLE_ALIAS[stem] ?? stem);
  if (direct) return direct;
  const found = byKey.get(titleKey(TITLE_ALIAS[stem] ?? stem)) ?? [];
  if (found.length <= 1) return found[0];
  // 열쇠가 겹치면 길이가 가장 가까운 곡으로 붙인다.
  let ms = Number.NaN;
  try {
    ms = probeDurationMs(file);
  } catch {
    return found[0];
  }
  return found.reduce((a, b) => (Math.abs(b.durationMs - ms) < Math.abs(a.durationMs - ms) ? b : a));
};

// 곡 하나에 파일이 여러 개일 수 있다(원본 + 리마스터). 곡별로 묶는다.
const candidates = new Map();
for (const full of files) {
  const name = basename(full);
  const stem = name.slice(0, -extname(name).length);
  const track = resolve(stem, full);
  if (!track) {
    skipped.push(stem);
    continue;
  }
  if (!candidates.has(track.id)) candidates.set(track.id, { track, files: [] });
  candidates.get(track.id).files.push(full);
}

/**
 * 사클에 올라간 그 마스터를 고른다 — 길이가 맞는 파일이 정의상 그것이다.
 * 파일명 표기(remaster 등)에 의존하지 않는다. 이름이 어떻든 스트리밍본과 길이가 맞아야 신호가 박에 맞는다.
 */
function pickMaster(entry) {
  const measured = entry.files.map((name) => {
    let drift = Number.NaN;
    try {
      drift = probeDurationMs(name) - entry.track.durationMs;
    } catch {
      drift = Number.NaN;
    }
    return { name, drift };
  });
  const usable = measured.filter((m) => Number.isFinite(m.drift));
  if (usable.length === 0) return { measured };
  // 길이로 먼저 고르고, 길이가 같으면(원본과 리마스터가 같은 길이인 경우가 흔하다) 리마스터를 집는다.
  usable.sort((a, b) => {
    const gap = Math.abs(a.drift) - Math.abs(b.drift);
    if (Math.abs(gap) > DRIFT_TIE_MS) return gap;
    return versionRank(basename(b.name)) - versionRank(basename(a.name)) || gap;
  });
  return { measured, best: usable[0] };
}

for (const entry of candidates.values()) {
  const track = entry.track;
  const { measured, best } = pickMaster(entry);
  if (!best) {
    mismatched.push({ title: track.title, drift: Number.NaN, tried: measured.map((m) => m.name) });
    continue;
  }
  const name = best.name;
  const others = measured.length > 1 ? `  (후보 ${measured.length}개 중 길이가 맞는 것)` : '';
  try {
    const { payload, report, mismatch } = analyze(name, track);
    if (mismatch !== undefined) {
      mismatched.push({ title: track.title, drift: mismatch, tried: measured.map((m) => basename(m.name)) });
      // 낡은 신호가 남아 있으면 틀린 박에 계속 뛴다. 지운다.
      const stale = join(OUT_DIR, `${track.id}.json`);
      if (existsSync(stale)) unlinkSync(stale);
      continue;
    }
    writeFileSync(join(OUT_DIR, `${track.id}.json`), JSON.stringify(payload));
    const size = (JSON.stringify(payload).length / 1024).toFixed(0);
    const beat =
      report.beats > 0
        ? `비트 ${report.bpm.toFixed(1)}BPM ÷${report.subdivision} ${report.beats}개(신뢰도 ${(report.confidence * 100).toFixed(0)}%)`
        : `비트 없음(신뢰도 ${(report.confidence * 100).toFixed(0)}% < ${GRID_MIN_CONFIDENCE * 100}%)`;
    console.log(`✓ ${track.title} — ${report.frames}프레임 ${size}KB, 온셋 ${report.onsets}개, ${beat}${others}`);
  } catch (error) {
    console.error(`✗ ${basename(name)}: ${error.message}`);
  }
}

if (existsSync(TMP)) unlinkSync(TMP);

// 어느 곡에 신호가 있는지 목록으로 남긴다. 앱이 곡마다 404를 두드리지 않아도 되게.
const built = readdirSync(OUT_DIR)
  .filter((name) => /^\d+\.json$/.test(name))
  .map((name) => Number(name.replace('.json', '')));
writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(built));
console.log(`\n신호 보유 ${built.length}곡 → signals/index.json`);

if (skipped.length) console.log(`제목이 목록과 안 맞아 건너뜀: ${skipped.join(', ')}`);
if (mismatched.length) {
  console.log('\n⚠ 사클에 올라간 마스터와 길이가 맞는 파일이 없어 건너뜀 (그 곡은 사클 파형 폴백으로 돕니다):');
  for (const { title, drift, tried } of mismatched) {
    const how = Number.isFinite(drift) ? `가장 가까운 것도 ${(drift / 1000).toFixed(1)}초 ${drift > 0 ? '길다' : '짧다'}` : '길이를 읽지 못했다';
    console.log(`   ${title}: ${how}  [${tried.join(', ')}]`);
  }
}
console.log(`\n${OUT_DIR.replace(process.cwd(), '.')} 에 생성. 신호가 있는 곡만 확장 시각으로 돈다.`);
