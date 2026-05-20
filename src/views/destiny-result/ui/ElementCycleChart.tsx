import type { FiveElement } from '@entities/destiny/model';

import { ELEMENT_COLOR } from '../constants';

const ELEMENTS: { key: FiveElement; label: string; hanja: string }[] = [
  { key: '木', label: '목', hanja: '木' },
  { key: '火', label: '화', hanja: '火' },
  { key: '土', label: '토', hanja: '土' },
  { key: '金', label: '금', hanja: '金' },
  { key: '水', label: '수', hanja: '水' },
];

const POSITIONS = [
  { x: 150, y: 38 },
  { x: 258, y: 120 },
  { x: 220, y: 248 },
  { x: 80, y: 248 },
  { x: 42, y: 120 },
];

const CIRCLE_R = 30;

const SANG_SAENG: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 0],
];

const SANG_SAENG_LABELS = ['목생화', '화생토', '토생금', '금생수', '수생목'];

const SANG_GEUK: [number, number][] = [
  [0, 2],
  [2, 4],
  [4, 1],
  [1, 3],
  [3, 0],
];

const SANG_GEUK_LABELS = ['목극토', '토극수', '수극화', '화극금', '금극목'];

function arrowPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: number,
  curve: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist;
  const ny = dy / dist;
  const sx = x1 + nx * r;
  const sy = y1 + ny * r;
  const ex = x2 - nx * (r + 7);
  const ey = y2 - ny * (r + 7);
  const mx = (sx + ex) / 2 - ny * curve;
  const my = (sy + ey) / 2 + nx * curve;
  return `M${sx},${sy} Q${mx},${my} ${ex},${ey}`;
}

function arrowHead(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: number,
  curve: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist;
  const ny = dy / dist;
  const ex = x2 - nx * (r + 7);
  const ey = y2 - ny * (r + 7);
  const mx = (x1 + nx * r + ex) / 2 - ny * curve;
  const my = (y1 + ny * r + ey) / 2 + nx * curve;
  const tx = ex - mx;
  const ty = ey - my;
  const td = Math.sqrt(tx * tx + ty * ty);
  const tnx = tx / td;
  const tny = ty / td;
  const size = 6;
  const p1x = ex - tnx * size + tny * size * 0.5;
  const p1y = ey - tny * size - tnx * size * 0.5;
  const p2x = ex - tnx * size - tny * size * 0.5;
  const p2y = ey - tny * size + tnx * size * 0.5;
  return `M${ex},${ey} L${p1x},${p1y} L${p2x},${p2y} Z`;
}

function labelPos(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curve: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist;
  const ny = dy / dist;
  return {
    x: (x1 + x2) / 2 - ny * curve * 0.65,
    y: (y1 + y2) / 2 + nx * curve * 0.65,
  };
}

export function ElementCycleChart() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <p className="text-sm font-bold text-[#1a1a2e] mb-4 text-center tracking-wide">
        오행의 상생 · 상극
      </p>
      <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto">
        {/* 상생 화살표 (외곽, 파란색) */}
        {SANG_SAENG.map(([from, to], i) => {
          const p1 = POSITIONS[from];
          const p2 = POSITIONS[to];
          return (
            <g key={`ss-${i}`}>
              <path
                d={arrowPath(p1.x, p1.y, p2.x, p2.y, CIRCLE_R, 25)}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={1.8}
                opacity={0.7}
              />
              <path
                d={arrowHead(p1.x, p1.y, p2.x, p2.y, CIRCLE_R, 25)}
                fill="#3b82f6"
                opacity={0.7}
              />
              {(() => {
                const lp = labelPos(p1.x, p1.y, p2.x, p2.y, 25);
                return (
                  <text
                    x={lp.x}
                    y={lp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={9}
                    fontWeight={500}
                    fill="#3b82f6"
                  >
                    {SANG_SAENG_LABELS[i]}
                  </text>
                );
              })()}
            </g>
          );
        })}

        {/* 상극 화살표 (내부 별, 빨간색) */}
        {SANG_GEUK.map(([from, to], i) => {
          const p1 = POSITIONS[from];
          const p2 = POSITIONS[to];
          return (
            <g key={`sg-${i}`}>
              <path
                d={arrowPath(p1.x, p1.y, p2.x, p2.y, CIRCLE_R, 0)}
                fill="none"
                stroke="#ef4444"
                strokeWidth={1.2}
                strokeDasharray="5,3"
                opacity={0.55}
              />
              <path
                d={arrowHead(p1.x, p1.y, p2.x, p2.y, CIRCLE_R, 0)}
                fill="#ef4444"
                opacity={0.55}
              />
              {(() => {
                const lp = labelPos(p1.x, p1.y, p2.x, p2.y, 0);
                return (
                  <text
                    x={lp.x}
                    y={lp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={8}
                    fontWeight={500}
                    fill="#ef4444"
                    opacity={0.85}
                  >
                    {SANG_GEUK_LABELS[i]}
                  </text>
                );
              })()}
            </g>
          );
        })}

        {/* 오행 원 */}
        {ELEMENTS.map((el, i) => {
          const { x, y } = POSITIONS[i];
          return (
            <g key={el.key}>
              <circle
                cx={x}
                cy={y}
                r={CIRCLE_R}
                fill={ELEMENT_COLOR[el.key]}
                stroke="#fff"
                strokeWidth={2}
              />
              <text
                x={x}
                y={y - 6}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={16}
                fontWeight={700}
                fill="#1a1a2e"
              >
                {el.hanja}
              </text>
              <text
                x={x}
                y={y + 12}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fontWeight={600}
                fill="#1a1a2e"
                opacity={0.7}
              >
                {el.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-center gap-6 mt-3 text-xs text-[#6b6b7b]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-[2px] bg-blue-500 rounded" />
          상생
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-[2px] border-t-2 border-dashed border-red-500" />
          상극
        </span>
      </div>
    </div>
  );
}
