import { cn } from '@shared/lib/cn';
import { outcomeOf } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/result.module.css';
import { DrawMark } from '@views/gostop/ui/DrawMark';
import { ResultCaption } from '@views/gostop/ui/ResultCaption';
import { ResultCelebration } from '@views/gostop/ui/ResultCelebration';
import { ResultJackpot } from '@views/gostop/ui/ResultJackpot';
import { ResultPayout } from '@views/gostop/ui/ResultPayout';
import { ResultPoints } from '@views/gostop/ui/ResultPoints';

export function ResultBanner() {
  const { result } = useGostopContext();
  const outcome = outcomeOf(result);
  const isWin = outcome === 'win';
  const isDraw = outcome === 'draw';

  return (
    <div data-outcome={outcome} className={cn(styles.banner, 'grid gap-2.5 px-4 pt-3.5 pb-3 text-center')}>
      {isWin && <ResultCelebration />}
      <ResultJackpot />
      <div className="grid grid-cols-[auto_1px_minmax(0,1fr)] items-center gap-x-4">
        {isDraw ? <DrawMark /> : <ResultPoints points={result?.points ?? 0} />}
        <span aria-hidden="true" className="h-11 bg-current opacity-20" />
        <ResultPayout />
      </div>
      <ResultCaption />
    </div>
  );
}
