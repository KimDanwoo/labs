'use client';

import type { FiveElementAnalysis } from '@entities/destiny/lib/fiveElements';
import type { FiveElement } from '@entities/destiny/model';

type FiveElementsChartProps = {
  fiveElements: FiveElementAnalysis;
};

const ELEMENT_CONFIG: Record<
  FiveElement,
  { color: string; bg: string; label: string; description: string }
> = {
  木: {
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.12)',
    label: '목',
    description: '나무·성장',
  },
  火: {
    color: '#f87171',
    bg: 'rgba(248,113,113,0.12)',
    label: '화',
    description: '불·열정',
  },
  土: {
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
    label: '토',
    description: '흙·안정',
  },
  金: {
    color: '#e2e8f0',
    bg: 'rgba(226,232,240,0.12)',
    label: '금',
    description: '쇠·결단',
  },
  水: {
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.12)',
    label: '수',
    description: '물·지혜',
  },
};

const ELEMENTS: FiveElement[] = ['木', '火', '土', '金', '水'];
const MAX_DISPLAY = 8;

export function FiveElementsChart({ fiveElements }: FiveElementsChartProps) {
  const { counts, missing, weak } = fiveElements;
  const maxCount = Math.max(...(Object.values(counts) as number[]));

  return (
    <div className="flex flex-col gap-4 bg-card-bg border border-card-border rounded-2xl p-4 shadow-lg shadow-black/40">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted tracking-widest uppercase">
          오행 분포 五行
        </h3>
        {missing.length > 0 && (
          <span className="text-xs text-red bg-[rgba(201,64,67,0.12)] border border-[rgba(201,64,67,0.3)] px-2 py-0.5 rounded-full">
            {missing.join(' ')} 부족
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {ELEMENTS.map((el) => {
          const count = counts[el];
          const config = ELEMENT_CONFIG[el];
          const isMissing = missing.includes(el);
          const isWeak = weak.includes(el) && !isMissing;
          const barWidth = maxCount > 0 ? (count / MAX_DISPLAY) * 100 : 0;

          return (
            <div key={el} className="flex items-center gap-3">
              {/* 오행 라벨 */}
              <div className="shrink-0 flex flex-col items-center w-8">
                <span
                  className="text-lg font-bold leading-none"
                  style={{ color: config.color }}
                >
                  {el}
                </span>
                <span className="text-[9px] text-muted mt-0.5">
                  {config.label}
                </span>
              </div>

              {/* 바 */}
              <div className="flex-1 relative h-6 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${barWidth}%`,
                    background: isMissing
                      ? 'rgba(201,64,67,0.15)'
                      : `linear-gradient(90deg, ${config.color}30 0%, ${config.color}80 100%)`,
                    border: isMissing
                      ? '1px solid rgba(201,64,67,0.3)'
                      : 'none',
                  }}
                />
                {count === 0 && (
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-[10px] text-red">없음</span>
                  </div>
                )}
              </div>

              {/* 개수 */}
              <div className="shrink-0 flex items-center gap-1 w-12 justify-end">
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{
                    color: isMissing
                      ? '#c94043'
                      : isWeak
                        ? '#8a8aa0'
                        : config.color,
                  }}
                >
                  {count}
                </span>
                <span className="text-[10px] text-muted">개</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 일간 오행 정보 */}
      <div className="flex items-center gap-2 pt-3 mt-1 border-t border-card-border">
        <span className="text-xs text-muted">일간 오행</span>
        <span
          className="text-sm font-semibold px-2 py-0.5 rounded-full"
          style={{
            color: ELEMENT_CONFIG[fiveElements.dayMasterElement].color,
            backgroundColor: ELEMENT_CONFIG[fiveElements.dayMasterElement].bg,
          }}
        >
          {fiveElements.dayMasterElement} {fiveElements.dayMasterYinYang}
        </span>
        <span className="text-xs text-muted">
          {ELEMENT_CONFIG[fiveElements.dayMasterElement].description}
        </span>
      </div>
    </div>
  );
}
