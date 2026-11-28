import { GOSTOP_COPY, RESULT_COPY } from '@views/gostop/config/copy';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { BakReasons } from '@views/gostop/ui/BakReasons';
import { GoLine } from '@views/gostop/ui/GoLine';
import { ResultRow } from '@views/gostop/ui/ResultRow';
import { ScoreLineChips } from '@views/gostop/ui/ScoreLineChips';

export function ResultSummary() {
  const { result } = useGostopContext();
  if (!result?.winner) return null;
  const hasGo = result.goCount > 0;
  const hasBaks = result.baks.length > 0;

  return (
    <dl className="mt-3 grid gap-3 rounded-2xl bg-weak p-4 text-[15px]">
      <ResultRow label={RESULT_COPY.scoreTitle}>
        <ScoreLineChips side={result.winner} />
      </ResultRow>
      <ResultRow label={GOSTOP_COPY.resultBase}>{`${result.base}${GOSTOP_COPY.points}`}</ResultRow>
      {hasGo && (
        <ResultRow label={GOSTOP_COPY.resultGo}>
          <GoLine goCount={result.goCount} />
        </ResultRow>
      )}
      {hasBaks && (
        <ResultRow label={RESULT_COPY.bakTitle}>
          <BakReasons />
        </ResultRow>
      )}
    </dl>
  );
}
