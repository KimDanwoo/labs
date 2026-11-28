import { BOARD_COPY, GOSTOP_COPY } from '@views/gostop/config/copy';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import type { Side } from '@views/gostop/model/types/gostop';
import { GoChip } from '@views/gostop/ui/GoChip';

interface SideScoreProps {
  side: Side;
}

export function SideScore({ side }: SideScoreProps) {
  const { scores } = useGostopContext();

  return (
    <dl className="ml-auto flex items-center gap-1.5 tabular-nums">
      <dt className="sr-only">{BOARD_COPY.score}</dt>
      <dd className="text-[19px] leading-none font-black text-lemon lg:text-[22px]">
        {scores[side].total}
        <span className="ml-0.5 text-[12px] font-bold text-lemon/80">{GOSTOP_COPY.points}</span>
      </dd>
      <GoChip side={side} />
    </dl>
  );
}
