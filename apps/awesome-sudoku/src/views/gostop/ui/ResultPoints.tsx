import { GOSTOP_COPY, RESULT_POINTS_LABEL } from '@views/gostop/config/copy';
import { outcomeOf } from '@views/gostop/lib/view';
import { useCountUp } from '@views/gostop/model/hooks/useCountUp';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';

interface ResultPointsProps {
  points: number;
}

export function ResultPoints({ points }: ResultPointsProps) {
  const { result, isReducedMotion } = useGostopContext();
  const shown = useCountUp(points, isReducedMotion);

  return (
    <p className="grid justify-items-center">
      <span className="text-[13px] font-bold opacity-75">{RESULT_POINTS_LABEL[outcomeOf(result)]}</span>
      <span className="text-[52px] leading-none font-black tracking-[-0.04em] tabular-nums">
        <span aria-hidden="true">{shown}</span>
        <span className="sr-only">{points}</span>
        <span className="ml-0.5 text-[22px] tracking-normal">{GOSTOP_COPY.points}</span>
      </span>
    </p>
  );
}
