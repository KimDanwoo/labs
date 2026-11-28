import { GOSTOP_COPY } from '@views/gostop/config/copy';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { BakStamps } from '@views/gostop/ui/BakStamps';
import { ResultPoints } from '@views/gostop/ui/ResultPoints';
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
        <BakStamps baks={result.baks} />
      </ResultRow>
      <ResultPoints points={result.points} />
    </dl>
  );
}
