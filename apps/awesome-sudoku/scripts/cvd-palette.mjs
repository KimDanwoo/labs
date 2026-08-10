// 색각이상(CVD) 시뮬레이션 기반 구역 팔레트 선택기
// 후보(hue×shade×alpha) → 배경 블렌딩 → 정상/적록/청황 시뮬레이션 → Lab ΔE 쌍별 최소거리 max-min 탐욕 선택
//
// 채도 상한(CHROMA_CAP)이 핵심 제약이다. 거리만 최대화하면 진한 원색과 연한 파스텔이 한 판에 섞여
// 기괴해지므로, "구분은 되는 범위에서 가장 차분한" 조합을 고른다.
// 출력은 채도 오름차순 — 앱은 넓은 구역부터 앞쪽(저채도) 색을 배정한다(regionColorIndexes).
import { readFileSync } from 'node:fs';

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const TW = require.resolve('tailwindcss/theme.css');
const css = readFileSync(TW, 'utf8');
const colors = {};
for (const m of css.matchAll(/--color-([a-z]+)-(\d+): oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)/g)) {
  colors[`${m[1]}-${m[2]}`] = [Number(m[3]) / 100, Number(m[4]), Number(m[5])];
}

/** 보드 최대 크기 = 필요한 구역 색 개수 */
const COUNT = 10;
/** 블렌딩 후 Lab 채도 상한 — 이 위로는 판에서 색이 튄다 */
const CHROMA_CAP = 60;
/** 라이트 모드 명도 하한 — 너무 어두운 배경은 ⭐/✕ 가독성을 해친다 */
const LIGHT_L_MIN = 74;

// OKLCh -> linear sRGB
function oklchToLinearRgb([L, C, hDeg]) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h),
    b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3,
    m = m_ ** 3,
    s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.min(1, Math.max(0, v)));
}
const HEX_BG = (hex) =>
  [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
const toHex = (lin) =>
  '#' +
  lin
    .map((v) => {
      const s = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
      return Math.round(Math.min(1, Math.max(0, s)) * 255)
        .toString(16)
        .padStart(2, '0');
    })
    .join('');

// Machado et al. 2009 (severity 1.0), linear RGB
const CVD = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};
const mul = (M, v) => M.map((row) => Math.min(1, Math.max(0, row[0] * v[0] + row[1] * v[1] + row[2] * v[2])));

// linear sRGB -> Lab (D65)
function rgbToLab([r, g, b]) {
  const X = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(X / 0.95047), f(Y), f(Z / 1.08883)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
const dE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const blend = (fg, bg, alpha) => fg.map((v, i) => v * alpha + bg[i] * (1 - alpha));

const LIGHT_BG = HEX_BG('#ffffff');
const DARK_BG = HEX_BG('#171d30');
const HUES = [
  'sky',
  'blue',
  'indigo',
  'violet',
  'fuchsia',
  'pink',
  'rose',
  'orange',
  'amber',
  'yellow',
  'lime',
  'emerald',
  'teal',
  'cyan',
  'slate',
  'stone',
];

const candidates = [];
for (const hue of HUES)
  for (const ls of [50, 100, 200, 300, 400])
    for (const la of [0.45, 0.6, 0.75, 0.9])
      for (const ds of [600, 700, 800, 900])
        for (const da of [0.3, 0.45, 0.6, 0.75]) {
          const lightKey = `${hue}-${ls}`,
            darkKey = `${hue}-${ds}`;
          if (!colors[lightKey] || !colors[darkKey]) continue;
          const light = blend(oklchToLinearRgb(colors[lightKey]), LIGHT_BG, la);
          const dark = blend(oklchToLinearRgb(colors[darkKey]), DARK_BG, da);
          const labs = {};
          for (const mode of ['normal', 'protan', 'deutan', 'tritan']) {
            const sim = (v) => (mode === 'normal' ? v : mul(CVD[mode], v));
            labs[`L_${mode}`] = rgbToLab(sim(light));
            labs[`D_${mode}`] = rgbToLab(sim(dark));
          }
          const [lL, la_, lb] = labs.L_normal;
          const [, da_, db] = labs.D_normal;
          const chroma = Math.max(Math.hypot(la_, lb), Math.hypot(da_, db));
          if (chroma > CHROMA_CAP || lL < LIGHT_L_MIN) continue;
          candidates.push({
            hue,
            cls: `bg-${hue}-${ls}/${la * 100} dark:bg-${hue}-${ds}/${da * 100}`,
            labs,
            chroma,
            hex: [toHex(light), toHex(dark)],
          });
        }

// 쌍 거리 = 모든 (모드×라이트/다크) 중 최솟값 (tritan은 희귀 → 0.7 가중으로 완화)
function pairDist(a, b) {
  let min = Infinity;
  for (const mode of ['normal', 'protan', 'deutan', 'tritan']) {
    const w = mode === 'tritan' ? 1 / 0.7 : 1;
    min = Math.min(
      min,
      dE(a.labs[`L_${mode}`], b.labs[`L_${mode}`]) * w,
      dE(a.labs[`D_${mode}`], b.labs[`D_${mode}`]) * w,
    );
  }
  return min;
}
const setScore = (s) => Math.min(...s.flatMap((a, i) => s.slice(i + 1).map((b) => pairDist(a, b))));

// 탐욕 max-min: hue당 1개, COUNT개 선택. 여러 시작점 시도 후 최고 채택
let best = { score: -1, set: [] };
const stride = Math.max(1, Math.floor(candidates.length / 30));
for (let start = 0; start < candidates.length; start += stride) {
  const set = [candidates[start]];
  const usedHues = new Set([candidates[start].hue]);
  while (set.length < COUNT) {
    let pick = null,
      pickScore = -1;
    for (const c of candidates) {
      if (usedHues.has(c.hue)) continue;
      const s = Math.min(...set.map((sel) => pairDist(sel, c)));
      if (s > pickScore) {
        pickScore = s;
        pick = c;
      }
    }
    if (!pick) break;
    set.push(pick);
    usedHues.add(pick.hue);
  }
  if (set.length < COUNT) continue;
  // 국소 탐색: 선택 하나를 다른 후보로 바꿔 전역 최소가 오르면 교체, 수렴까지
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < set.length; i++) {
      for (const c of candidates) {
        if (set.some((sel, j) => j !== i && sel.hue === c.hue)) continue;
        const trial = [...set];
        trial[i] = c;
        if (setScore(trial) > setScore(set)) {
          set[i] = c;
          improved = true;
        }
      }
    }
  }
  const score = setScore(set);
  if (score > best.score) best = { score, set };
}

// 채도 오름차순 — 넓은 구역이 앞쪽(차분한) 색을 받는다
best.set.sort((a, b) => a.chroma - b.chroma);

console.log(`후보 ${candidates.length}개 (채도≤${CHROMA_CAP}, 라이트 명도≥${LIGHT_L_MIN})`);
console.log(`min pairwise ΔE (전 모드): ${best.score.toFixed(1)}`);
console.log(
  `채도 평균 ${(best.set.reduce((s, c) => s + c.chroma, 0) / COUNT).toFixed(1)} · 최대 ${Math.max(...best.set.map((c) => c.chroma)).toFixed(1)}`,
);
console.log('\n// 채도 오름차순 — 넓은 구역이 앞쪽을 받는다');
for (const c of best.set)
  console.log(`  '${c.cls}', // 채도 ${c.chroma.toFixed(0).padStart(2)} ${c.hex[0]} ${c.hex[1]}`);
// 모드별 최악 쌍 리포트
console.log('');
for (const mode of ['normal', 'protan', 'deutan', 'tritan']) {
  let worst = { d: Infinity, pair: '' };
  for (let i = 0; i < best.set.length; i++)
    for (let j = i + 1; j < best.set.length; j++) {
      for (const side of ['L', 'D']) {
        const d = dE(best.set[i].labs[`${side}_${mode}`], best.set[j].labs[`${side}_${mode}`]);
        if (d < worst.d) worst = { d, pair: `${best.set[i].hue}↔${best.set[j].hue}(${side})` };
      }
    }
  console.log(`${mode} worst: ΔE ${worst.d.toFixed(1)} ${worst.pair}`);
}
console.log(
  '\nJSON' +
    JSON.stringify(
      best.set.map((c) => ({ cls: c.cls, chroma: Number(c.chroma.toFixed(1)), light: c.hex[0], dark: c.hex[1] })),
    ),
);
