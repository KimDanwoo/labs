import {
  ELEMENT_COLOR,
  ELEMENT_EMOJI,
  ELEMENT_KR,
} from '@views/destiny-result/constants';

import type { FiveElementAnalysis } from '@entities/destiny/lib/fiveElements';
import type { FiveElement } from '@entities/destiny/model';

import { cn } from '@shared/lib/cn';

type ElementBarLightProps = {
  fiveElements: FiveElementAnalysis;
};

export function ElementBarLight({ fiveElements }: ElementBarLightProps) {
  const max = Math.max(...Object.values(fiveElements.counts), 1);
  return (
    <div className="flex flex-col gap-3">
      {(Object.entries(fiveElements.counts) as [FiveElement, number][]).map(
        ([el, count]) => (
          <div key={el} className="flex items-center gap-3">
            <span className="text-lg w-7">{ELEMENT_EMOJI[el]}</span>
            <span className="text-sm text-[#6b6b7b] w-8 font-medium">
              {ELEMENT_KR[el]}
            </span>
            <div className="flex-1 h-6 bg-[#f0ede8] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(count / max) * 100}%`,
                  backgroundColor: ELEMENT_COLOR[el],
                  opacity: count === 0 ? 0 : 0.85,
                }}
              />
            </div>
            <span
              className={cn(
                'w-5 text-right text-sm font-bold',
                count === 0 ? 'text-red' : 'text-[#1a1a2e]',
              )}
            >
              {count}
            </span>
          </div>
        ),
      )}
    </div>
  );
}
