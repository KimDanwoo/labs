import { BOARD_COPY, GOSTOP_COPY } from '@views/gostop/config/copy';
import { goBonusOf } from '@views/gostop/lib/goBonus';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import type { Side } from '@views/gostop/model/types/gostop';

interface SideScoreProps {
  side: Side;
}

export function SideScore({ side }: SideScoreProps) {
  const { scores, goCount } = useGostopContext();
  const count = goCount[side];
  const bonus = goBonusOf(count);

  return (
    <dl className="ml-auto flex items-center gap-1.5 tabular-nums">
      <dt className="sr-only">{BOARD_COPY.score}</dt>
      <dd className="text-[19px] leading-none font-black text-lemon lg:text-[22px]">
        {scores[side].total}
        <span className="ml-0.5 text-[12px] font-bold text-lemon/80">{GOSTOP_COPY.points}</span>
      </dd>
      <dt className="sr-only">{BOARD_COPY.goBonus}</dt>
      <dd className="inline-flex h-6 items-center gap-1 rounded-full bg-white/10 px-2 text-[12px] font-bold text-white/90">
        {count}
        {GOSTOP_COPY.goUnit}
        <span className="font-semibold text-white/65">
          +{bonus.add} ×{bonus.times}
        </span>
      </dd>
    </dl>
  );
}
