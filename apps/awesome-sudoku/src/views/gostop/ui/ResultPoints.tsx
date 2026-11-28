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
    <div className="mt-1 flex items-baseline justify-between border-t border-border-light pt-3">
      <dt className="font-semibold text-text-secondary">{RESULT_POINTS_LABEL[outcomeOf(result)]}</dt>
      <dd className="text-4xl font-black text-text-primary tabular-nums">
        <span aria-hidden="true">{shown}</span>
        <span className="sr-only">{points}</span>
        {GOSTOP_COPY.points}
      </dd>
    </div>
  );
}
