'use client';

import { HOME_HEADLINE_LINES } from '@views/game-library/config/homeCopy';
import { useTodayLabel } from '@views/game-library/model/hooks/useTodayLabel';

export function HomeGreeting() {
  const todayLabel = useTodayLabel();

  return (
    <div>
      <p className="min-h-[22px] text-[15px] font-semibold text-text-tertiary">{todayLabel}</p>
      <h1 className="mt-1.5 text-[30px] leading-[1.36] font-extrabold tracking-[-0.035em] lg:text-[40px] lg:leading-[1.3]">
        {HOME_HEADLINE_LINES.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </h1>
    </div>
  );
}
