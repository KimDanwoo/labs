import { cn } from '@shared/lib/cn';
import { GLASS_CLASS } from '@views/lotto/config/style';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoProgressBar } from '@views/lotto/ui/LottoProgressBar';
import { LottoStatusText } from '@views/lotto/ui/LottoStatusText';
import { LottoStopButton } from '@views/lotto/ui/LottoStopButton';

export function LottoStatus() {
  const { singleDraw, isSimulating } = useLottoContext();

  return (
    <div className="flex items-center gap-2">
      <div className={cn('relative overflow-hidden rounded-full text-center', isSimulating && 'min-w-56', GLASS_CLASS)}>
        <p
          role="status"
          aria-live="polite"
          className="px-4 py-1.5 text-sm font-semibold text-text-primary font-tabular"
        >
          <LottoStatusText key={singleDraw?.round ?? 0} />
        </p>
        {isSimulating && <LottoProgressBar />}
      </div>
      {isSimulating && <LottoStopButton />}
    </div>
  );
}
