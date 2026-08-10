// 2★(구역당 별 2개) 타당성 스파이크 — 재현: node scripts/star2-spike.mjs
//
// 질문: 1★에서 못 푼 "구역이 2칸 조각뿐이라 판이 한줄 두줄로 보인다" 문제가 2★에선 풀리는가?
// 1★ 기준선(측정 완료, 10×10): 완전 균등 구역 → 유일해 0% / 유일해 8.2%를 얻으려면 3칸이하 조각 7.5개·중앙 2.4칸
//
// 결론(아래 실행 결과): 구역 문제는 풀린다. 다만 아래 일반화 솔버는 2★ 판을 완주하지 못한다(0수 교착) —
// 사람 기법으로 풀리는지(노게싱)는 아직 미검증이며, 그게 다음 관문이다.

const N8 = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];
const N4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ── 일반화 논리 솔버 (별 K개 / 행·열·구역) ────────────────────────────
// 행·열·구역을 "cells + need" 하나의 모양으로 통일한다. 그 덕에 1★ 솔버의 (c)(d) 규칙이 T2 하나로 합쳐진다.

export const solveK = (regions, K) => {
  const size = regions.length;
  const cand = Array.from({ length: size }, () => Array(size).fill(true));
  const rowN = Array(size).fill(0);
  const colN = Array(size).fill(0);
  const regN = Array(size).fill(0);
  const reg = (r, c) => (regions[r] === undefined ? -1 : (regions[r][c] ?? -1));
  const inside = (r, c) => r >= 0 && r < size && c >= 0 && c < size;
  const isCand = (r, c) => inside(r, c) && cand[r][c];
  const drop = (r, c) => {
    if (!isCand(r, c)) return false;
    cand[r][c] = false;
    return true;
  };

  let placed = 0;
  const place = (r, c) => {
    cand[r][c] = false;
    placed++;
    rowN[r]++;
    colN[c]++;
    const id = reg(r, c);
    regN[id]++;
    for (const [dr, dc] of N8) drop(r + dr, c + dc);
    if (rowN[r] === K) for (let x = 0; x < size; x++) drop(r, x);
    if (colN[c] === K) for (let x = 0; x < size; x++) drop(x, c);
    if (regN[id] === K) for (let a = 0; a < size; a++) for (let b = 0; b < size; b++) if (reg(a, b) === id) drop(a, b);
  };

  const units = () => {
    const out = [];
    for (let r = 0; r < size; r++) {
      const cells = [];
      for (let c = 0; c < size; c++) if (isCand(r, c)) cells.push([r, c]);
      out.push({ cells, need: K - rowN[r] });
    }
    for (let c = 0; c < size; c++) {
      const cells = [];
      for (let r = 0; r < size; r++) if (isCand(r, c)) cells.push([r, c]);
      out.push({ cells, need: K - colN[c] });
    }
    for (let id = 0; id < size; id++) {
      const cells = [];
      for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++) if (reg(r, c) === id && isCand(r, c)) cells.push([r, c]);
      out.push({ cells, need: K - regN[id] });
    }
    return out;
  };

  let t2Rounds = 0;
  let t3Rounds = 0;
  let progress = true;

  while (progress && placed < size * K) {
    progress = false;
    let usedT2 = false;
    let usedT3 = false;

    // T1: 남은 자리 수 == 후보 수 → 전부 확정 (한 수 두면 판이 바뀌므로 즉시 재계산)
    for (const u of units()) {
      if (u.need <= 0) continue;
      if (u.cells.length < u.need) return { solved: false, placed, t2Rounds, t3Rounds };
      if (u.cells.length === u.need) {
        for (const [r, c] of u.cells) if (isCand(r, c)) place(r, c);
        progress = true;
        break;
      }
    }
    if (progress) continue;

    // T2: A의 후보가 B에 전부 들어있고 남은 자리 수가 같다 → B는 A 밖에서 별을 못 받는다
    const us = units().filter((u) => u.need > 0 && u.cells.length > 0);
    const key = ([r, c]) => r * size + c;
    for (const a of us) {
      const aKeys = new Set(a.cells.map(key));
      for (const b of us) {
        if (a === b || b.need !== a.need || b.cells.length <= a.cells.length) continue;
        const bKeys = new Set(b.cells.map(key));
        if (!a.cells.every((cell) => bKeys.has(key(cell)))) continue;
        for (const [r, c] of b.cells)
          if (!aKeys.has(key([r, c])) && drop(r, c)) {
            progress = true;
            usedT2 = true;
          }
      }
    }
    if (progress) {
      if (usedT2) t2Rounds++;
      continue;
    }

    // T3: 한 수 앞 모순 — 여기에 두면 어떤 미완 단위가 필요 개수를 못 채운다
    const wouldBreak = (sr, sc) => {
      const sid = reg(sr, sc);
      const killRow = rowN[sr] + 1 === K;
      const killCol = colN[sc] + 1 === K;
      const killReg = regN[sid] + 1 === K;
      const survives = (r, c) => {
        if (!isCand(r, c)) return false;
        if (r === sr && c === sc) return false;
        if (Math.abs(r - sr) <= 1 && Math.abs(c - sc) <= 1) return false;
        if (killRow && r === sr) return false;
        if (killCol && c === sc) return false;
        if (killReg && reg(r, c) === sid) return false;
        return true;
      };
      const short = (cells, already, isOwn) => {
        const need = K - already - (isOwn ? 1 : 0);
        if (need <= 0) return false;
        let alive = 0;
        for (const [r, c] of cells) if (survives(r, c)) alive++;
        return alive < need;
      };
      for (let r = 0; r < size; r++) {
        const cells = [];
        for (let c = 0; c < size; c++) if (isCand(r, c)) cells.push([r, c]);
        if (short(cells, rowN[r], r === sr)) return true;
      }
      for (let c = 0; c < size; c++) {
        const cells = [];
        for (let r = 0; r < size; r++) if (isCand(r, c)) cells.push([r, c]);
        if (short(cells, colN[c], c === sc)) return true;
      }
      for (let id = 0; id < size; id++) {
        const cells = [];
        for (let r = 0; r < size; r++)
          for (let c = 0; c < size; c++) if (reg(r, c) === id && isCand(r, c)) cells.push([r, c]);
        if (short(cells, regN[id], id === sid)) return true;
      }
      return false;
    };

    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (isCand(r, c) && wouldBreak(r, c) && drop(r, c)) {
          progress = true;
          usedT3 = true;
        }
    if (usedT3) t3Rounds++;
  }

  return { solved: placed === size * K, placed, t2Rounds, t3Rounds };
};

// ── 브루트포스 해 카운터 (2개 찾으면 중단) ────────────────────────────

export const countSolutionsK = (regions, K) => {
  const size = regions.length;
  const reg = (r, c) => (regions[r] === undefined ? -1 : (regions[r][c] ?? -1));
  const colN = Array(size).fill(0);
  const regN = Array(size).fill(0);
  let prevRow = [];
  let count = 0;

  const rowChoices = (r, prev) => {
    const out = [];
    const pick = (start, acc) => {
      if (acc.length === K) {
        // 같은 행에서 같은 구역을 두 번 쓰는 경우까지 정원 확인
        const bump = new Map();
        for (const c of acc) bump.set(reg(r, c), (bump.get(reg(r, c)) ?? 0) + 1);
        for (const [id, n] of bump) if (regN[id] + n > K) return;
        out.push([...acc]);
        return;
      }
      for (let c = start; c < size; c++) {
        const last = acc[acc.length - 1];
        if (last !== undefined && c - last < 2) continue;
        if (colN[c] >= K) continue;
        if (prev.some((p) => Math.abs(p - c) <= 1)) continue;
        if (regN[reg(r, c)] >= K) continue;
        acc.push(c);
        pick(c + 1, acc);
        acc.pop();
      }
    };
    pick(0, []);
    return out;
  };

  const rec = (r) => {
    if (count >= 2) return;
    if (r === size) {
      count++;
      return;
    }
    const rowsLeft = size - r;
    for (let c = 0; c < size; c++) if (K - colN[c] > rowsLeft) return;

    const saved = prevRow;
    for (const choice of rowChoices(r, saved)) {
      for (const c of choice) {
        colN[c]++;
        regN[reg(r, c)]++;
      }
      prevRow = choice;
      rec(r + 1);
      prevRow = saved;
      for (const c of choice) {
        colN[c]--;
        regN[reg(r, c)]--;
      }
      if (count >= 2) return;
    }
  };

  rec(0);
  return count;
};

// ── 2★ 별 배치 ────────────────────────────────────────────────────────

export const generatePlacementK = (size, K) => {
  const colN = Array(size).fill(0);
  const chosen = [];

  const rowOptions = (prev) => {
    const out = [];
    const pick = (start, acc) => {
      if (acc.length === K) {
        out.push([...acc]);
        return;
      }
      for (let c = start; c < size; c++) {
        const last = acc[acc.length - 1];
        if (last !== undefined && c - last < 2) continue;
        if (colN[c] >= K) continue;
        if (prev.some((p) => Math.abs(p - c) <= 1)) continue;
        acc.push(c);
        pick(c + 1, acc);
        acc.pop();
      }
    };
    pick(0, []);
    return shuffle(out);
  };

  const rec = (r) => {
    if (r === size) return colN.every((n) => n === K);
    const rowsLeft = size - r;
    for (let c = 0; c < size; c++) if (K - colN[c] > rowsLeft) return false;
    for (const opt of rowOptions(chosen[r - 1] ?? [])) {
      for (const c of opt) colN[c]++;
      chosen[r] = opt;
      if (rec(r + 1)) return true;
      for (const c of opt) colN[c]--;
      chosen.length = r;
    }
    return false;
  };

  if (!rec(0)) return null;
  const cells = [];
  chosen.forEach((cols, r) => cols.forEach((c) => cells.push([r, c])));
  return cells;
};

// ── 구역 만들기: 짝지은 별 2개를 경로로 잇고, 남은 칸을 가중 성장 ─────
// growthExponent 0 = 항상 가장 작은 구역부터(완전 균등) · >0 = 크기^지수 가중(rich-get-richer)

export const buildRegions = (size, stars, growthExponent = 0) => {
  const grid = Array.from({ length: size }, () => Array(size).fill(-1));
  const starKey = new Set(stars.map(([r, c]) => r * size + c));

  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  const order = [];
  for (let i = 0; i < stars.length; i++)
    for (let j = i + 1; j < stars.length; j++) order.push({ i, j, d: dist(stars[i], stars[j]) });
  order.sort((a, b) => a.d - b.d);

  const used = new Set();
  const pairs = [];
  for (const { i, j } of order) {
    if (used.has(i) || used.has(j)) continue;
    used.add(i);
    used.add(j);
    pairs.push([stars[i], stars[j]]);
  }
  if (pairs.length !== size) return null;

  // 짝 사이 최단 경로 확보 (다른 별 칸·이미 배정된 칸은 통과 금지)
  pairs.forEach(([a, b], id) => {
    const prev = new Map();
    const seen = new Set([a[0] * size + a[1]]);
    const queue = [a];
    let found = false;
    while (queue.length > 0 && !found) {
      const cur = queue.shift();
      for (const [dr, dc] of N4) {
        const nr = cur[0] + dr;
        const nc = cur[1] + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        const k = nr * size + nc;
        if (seen.has(k)) continue;
        const isTarget = nr === b[0] && nc === b[1];
        if (!isTarget && (starKey.has(k) || grid[nr][nc] !== -1)) continue;
        seen.add(k);
        prev.set(k, cur[0] * size + cur[1]);
        if (isTarget) {
          found = true;
          break;
        }
        queue.push([nr, nc]);
      }
    }
    if (!found) return;
    let k = b[0] * size + b[1];
    while (k !== undefined) {
      grid[Math.floor(k / size)][k % size] = id;
      k = prev.get(k);
    }
    grid[a[0]][a[1]] = id;
  });
  for (const [a, b] of pairs) if (grid[a[0]][a[1]] === -1 || grid[b[0]][b[1]] === -1) return null;

  const counts = Array(size).fill(0);
  for (const row of grid) for (const id of row) if (id >= 0) counts[id]++;
  let remaining = size * size - counts.reduce((s, v) => s + v, 0);

  while (remaining > 0) {
    let ids;
    if (growthExponent === 0) {
      ids = shuffle([...Array(size).keys()]).sort((x, y) => counts[x] - counts[y]);
    } else {
      const weights = [...Array(size).keys()].map((id) => Math.max(counts[id], 1) ** growthExponent);
      const total = weights.reduce((a, b) => a + b, 0);
      let ticket = Math.random() * total;
      let chosen = size - 1;
      for (let id = 0; id < size; id++) {
        ticket -= weights[id];
        if (ticket <= 0) {
          chosen = id;
          break;
        }
      }
      ids = [chosen, ...shuffle([...Array(size).keys()])];
    }

    let grew = false;
    for (const id of ids) {
      const opts = [];
      for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++) {
          if (grid[r][c] !== -1) continue;
          if (N4.some(([dr, dc]) => grid[r + dr]?.[c + dc] === id)) opts.push([r, c]);
        }
      const pick = opts[Math.floor(Math.random() * opts.length)];
      if (!pick) continue;
      grid[pick[0]][pick[1]] = id;
      counts[id]++;
      remaining--;
      grew = true;
      break;
    }
    if (!grew) return null;
  }

  const perRegion = Array(size).fill(0);
  for (const [r, c] of stars) perRegion[grid[r][c]]++;
  if (perRegion.some((n) => n !== 2)) return null;
  return grid;
};

// ── 실행 ─────────────────────────────────────────────────────────────

const toRegions = (rows) => rows.map((row) => [...row].map((ch) => ch.charCodeAt(0) - 65));
const SOLVABLE_1 = toRegions(['CAAAAA', 'CAABBB', 'CCEEBB', 'CCEEDF', 'CCEEFF', 'CEEEEF']);
const AMBIGUOUS_1 = toRegions(['AABBBB', 'AABBBC', 'AABBBC', 'DDEEEC', 'DDEEEC', 'DDEEFC']);

const ok = (b) => (b ? 'OK' : 'FAIL');
console.log('[정합성] K=1 솔버      :', ok(solveK(SOLVABLE_1, 1).solved && !solveK(AMBIGUOUS_1, 1).solved));
console.log(
  '[정합성] K=1 브루트포스:',
  ok(countSolutionsK(SOLVABLE_1, 1) === 1 && countSolutionsK(AMBIGUOUS_1, 1) === 2),
);

// 카운터가 알려진 해를 반드시 찾는지 — 0이 나오면 카운터 버그라 아래 수치가 전부 무의미해진다
for (const size of [8, 9, 10]) {
  let zero = 0;
  let n = 0;
  for (let i = 0; i < 60; i++) {
    const stars = generatePlacementK(size, 2);
    if (!stars) continue;
    const regions = buildRegions(size, stars, 2.2);
    if (!regions) continue;
    n++;
    if (countSolutionsK(regions, 2) === 0) zero++;
  }
  console.log(`[정합성] ${size}×${size} 2★ ${n}판 중 해0개 ${zero} :`, ok(zero === 0));
}

console.log('\n[측정] 2★ 10×10 — 구역 균형 vs 유일해');
for (const exp of [0, 1.3, 1.8, 2.2, 3]) {
  const TRIES = 250;
  let shaped = 0;
  let unique = 0;
  let tiny = 0;
  let med = 0;
  let max = 0;
  const t0 = performance.now();
  for (let i = 0; i < TRIES; i++) {
    const stars = generatePlacementK(10, 2);
    if (!stars) continue;
    const regions = buildRegions(10, stars, exp);
    if (!regions) continue;
    shaped++;
    if (countSolutionsK(regions, 2) !== 1) continue;
    unique++;
    const counts = Array(10).fill(0);
    for (const row of regions) for (const id of row) counts[id]++;
    const sorted = [...counts].sort((a, b) => a - b);
    tiny += counts.filter((c) => c <= 3).length;
    med += sorted[5];
    max += sorted[9];
  }
  const ms = performance.now() - t0;
  const label = String(exp === 0 ? '완전균등' : exp).padStart(6);
  const rate = ((unique / shaped) * 100).toFixed(1).padStart(5);
  const per = unique ? (ms / unique).toFixed(0) : '-';
  const f = (v) => (unique ? (v / unique).toFixed(1) : '-');
  console.log(
    `  지수 ${label} | 유일해 ${rate}% (${unique}/${shaped})  판당 ${per}ms | 3칸이하 ${f(tiny)}개 중앙 ${f(med)}칸 최대 ${f(max)}칸`,
  );
}

console.log('\n[미해결] 위 일반화 솔버는 2★ 판을 하나도 완주하지 못한다 — 0수에서 교착.');
console.log('  1★을 여는 규칙("2칸 구역이 한 줄에 갇힘")이 균등한 구역에선 발동하지 않는다.');
console.log('  2★에는 집합 카운팅·연속 행/열 블록 카운팅 같은 더 강한 규칙이 필요하다.');
