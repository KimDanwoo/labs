import { cn } from '@shared/lib/cn';
import { RESULT_CAPTION } from '@views/gostop/config/copy';
import { outcomeOf } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/result.module.css';
import { DrawMark } from '@views/gostop/ui/DrawMark';
import { ResultCelebration } from '@views/gostop/ui/ResultCelebration';
import { ResultPoints } from '@views/gostop/ui/ResultPoints';

export function ResultBanner() {
  const { result } = useGostopContext();
  const outcome = outcomeOf(result);
  const isWin = outcome === 'win';
  const isDraw = outcome === 'draw';

  return (
    <div
      data-outcome={outcome}
      className={cn(styles.banner, 'grid justify-items-center gap-1 px-5 pt-5 pb-4 text-center')}
    >
      {isWin && <ResultCelebration />}
      {isDraw ? <DrawMark /> : <ResultPoints points={result?.points ?? 0} />}
      <p className="text-[14px] font-semibold opacity-80 break-keep">{RESULT_CAPTION[outcome]}</p>
    </div>
  );
}
