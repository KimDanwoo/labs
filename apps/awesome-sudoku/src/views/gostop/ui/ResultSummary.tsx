import { Badge } from '@shared/ui/badge';
import { BAK_LABEL, GOSTOP_COPY, RESULT_POINTS_LABEL } from '@views/gostop/config/copy';
import { outcomeOf } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { ResultRow } from '@views/gostop/ui/ResultRow';

export function ResultSummary() {
  const { result } = useGostopContext();

  if (!result?.winner) {
    return (
      <p className="mt-4 rounded-2xl bg-weak p-4 text-center text-[15px] text-text-secondary break-keep">
        {GOSTOP_COPY.resultDraw}
      </p>
    );
  }

  const hasBaks = result.baks.length > 0;

  return (
    <dl className="mt-4 grid gap-2.5 rounded-2xl bg-weak p-4 text-[15px]">
      <ResultRow label={GOSTOP_COPY.resultBase}>
        {result.base}
        {GOSTOP_COPY.points}
      </ResultRow>
      <ResultRow label={GOSTOP_COPY.resultGo}>
        {result.goCount}
        {GOSTOP_COPY.goTimes}
      </ResultRow>
      <ResultRow label={GOSTOP_COPY.resultBaks}>
        {hasBaks
          ? result.baks.map((bak) => <Badge key={bak}>{`${BAK_LABEL[bak]} ${GOSTOP_COPY.bakTimes}`}</Badge>)
          : GOSTOP_COPY.resultNoBak}
      </ResultRow>
      <div className="mt-1 flex items-baseline justify-between border-t border-border-light pt-3">
        <dt className="font-semibold text-text-secondary">{RESULT_POINTS_LABEL[outcomeOf(result)]}</dt>
        <dd className="text-3xl font-extrabold text-text-primary tabular-nums">
          {result.points}
          {GOSTOP_COPY.points}
        </dd>
      </div>
    </dl>
  );
}
