#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { analyze } from './audio/analyzeTrack.mjs';
import { TMP, probeDurationMs } from './audio/dsp.mjs';
import { GRID_MIN_CONFIDENCE } from './audio/grid.mjs';
import { selftest } from './audio/selftest.mjs';
import { DRIFT_TIE_MS, titleKey, versionRank } from './audio/titles.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const TRACKS_FILE = join(HERE, '..', 'src', 'entities', 'track', 'model', 'constants', 'tracks.ts');
const OUT_DIR = join(HERE, '..', 'public', 'signals');

const TITLE_ALIAS = { 네온사인: 'Neon Sign', '네가 만든 Scene': 'Scene' };

const AUDIO_EXT = new Set(['.mp3', '.wav', '.m4a', '.flac', '.aiff', '.aif', '.ogg']);

if (process.argv[2] === '--selftest') {
  selftest();
  process.exit();
}

const folder = process.argv[2];
const isMissingFolder = !folder || !existsSync(folder);
if (isMissingFolder) {
  console.error('사용: node scripts/analyze-audio.mjs <오디오폴더> | --selftest');
  process.exit(1);
}

const { TRACKS } = await import(pathToFileURL(TRACKS_FILE).href);
const tracks = TRACKS.filter((track) => track.isAvailable !== false);
const byTitle = new Map(tracks.map((track) => [track.title, track]));
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
  let ms = Number.NaN;
  try {
    ms = probeDurationMs(file);
  } catch {
    return found[0];
  }
  return found.reduce((a, b) => (Math.abs(b.durationMs - ms) < Math.abs(a.durationMs - ms) ? b : a));
};

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
  usable.sort((a, b) => {
    const gap = Math.abs(a.drift) - Math.abs(b.drift);
    if (Math.abs(gap) > DRIFT_TIE_MS) return gap;
    return versionRank(basename(b.name)) - versionRank(basename(a.name)) || gap;
  });
  return { measured, best: usable[0] };
}

function describeBeat(report) {
  const percent = (report.confidence * 100).toFixed(0);
  if (report.beats > 0)
    return `비트 ${report.bpm.toFixed(1)}BPM ÷${report.subdivision} ${report.beats}개(신뢰도 ${percent}%)`;
  return `비트 없음(신뢰도 ${percent}% < ${GRID_MIN_CONFIDENCE * 100}%)`;
}

function removeStaleSignal(track) {
  const stale = join(OUT_DIR, `${track.id}.json`);
  if (existsSync(stale)) unlinkSync(stale);
}

function processEntry(entry) {
  const track = entry.track;
  const { measured, best } = pickMaster(entry);
  if (!best) {
    mismatched.push({ title: track.title, drift: Number.NaN, tried: measured.map((m) => m.name) });
    return;
  }
  const name = best.name;
  const others = measured.length > 1 ? `  (후보 ${measured.length}개 중 길이가 맞는 것)` : '';
  try {
    const { payload, report, mismatch } = analyze(name, track);
    if (mismatch !== undefined) {
      mismatched.push({ title: track.title, drift: mismatch, tried: measured.map((m) => basename(m.name)) });
      removeStaleSignal(track);
      return;
    }
    writeFileSync(join(OUT_DIR, `${track.id}.json`), JSON.stringify(payload));
    const size = (JSON.stringify(payload).length / 1024).toFixed(0);
    console.log(
      `✓ ${track.title} — ${report.frames}프레임 ${size}KB, 온셋 ${report.onsets}개, ${describeBeat(report)}${others}`,
    );
  } catch (error) {
    console.error(`✗ ${basename(name)}: ${error.message}`);
  }
}

for (const entry of candidates.values()) processEntry(entry);

if (existsSync(TMP)) unlinkSync(TMP);

const built = readdirSync(OUT_DIR)
  .filter((name) => /^\d+\.json$/.test(name))
  .map((name) => Number(name.replace('.json', '')));
writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify(built));
console.log(`\n신호 보유 ${built.length}곡 → signals/index.json`);

if (skipped.length) console.log(`제목이 목록과 안 맞아 건너뜀: ${skipped.join(', ')}`);
if (mismatched.length) {
  console.log('\n⚠ 사클에 올라간 마스터와 길이가 맞는 파일이 없어 건너뜀 (그 곡은 사클 파형 폴백으로 돕니다):');
  for (const { title, drift, tried } of mismatched) {
    const how = Number.isFinite(drift)
      ? `가장 가까운 것도 ${(drift / 1000).toFixed(1)}초 ${drift > 0 ? '길다' : '짧다'}`
      : '길이를 읽지 못했다';
    console.log(`   ${title}: ${how}  [${tried.join(', ')}]`);
  }
}
console.log(`\n${OUT_DIR.replace(process.cwd(), '.')} 에 생성. 신호가 있는 곡만 확장 시각으로 돈다.`);
