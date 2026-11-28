import { cn } from '@shared/lib/cn';
import { BAK_LABEL, RESULT_COPY } from '@views/gostop/config/copy';
import { stampDelay } from '@views/gostop/lib/countUp';
import { bakLines } from '@views/gostop/lib/resultLines';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/result.module.css';

export function BakReasons() {
  const { result, captured, goCount } = useGostopContext();
  if (!result) return null;

  return (
    <ul className="grid justify-items-end gap-1.5">
      {bakLines(result, captured, goCount).map((line, index) => (
        <li key={line.bak} className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-text-secondary">{line.reason}</span>
          <span
            className={cn(
              'inline-flex h-7 -rotate-3 items-center rounded-md border-2 border-hwatu-red px-2 text-[13px] font-black text-hwatu-red',
              styles.stamp,
            )}
            style={{ animationDelay: `${stampDelay(index)}ms` }}
          >
            {`${BAK_LABEL[line.bak]} ${RESULT_COPY.bakTimes}`}
          </span>
        </li>
      ))}
    </ul>
  );
}
