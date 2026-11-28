import { bakLines } from '@views/gostop/lib/resultLines';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { BakStamp } from '@views/gostop/ui/BakStamp';
import { GoLine } from '@views/gostop/ui/GoLine';

export function ResultMultipliers() {
  const { result, captured, goCount } = useGostopContext();
  if (!result) return null;
  const hasGo = result.goCount > 0;

  return (
    <ul className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1.5">
      {hasGo && <GoLine goCount={result.goCount} />}
      {bakLines(result, captured, goCount).map((line, order) => (
        <li key={line.bak} className="inline-flex items-center gap-1">
          <BakStamp bak={line.bak} order={order} />
          <span className="text-[12px] font-semibold whitespace-nowrap text-text-tertiary">{line.reason}</span>
        </li>
      ))}
    </ul>
  );
}
