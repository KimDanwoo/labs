import { freshDrawOf } from '@views/lotto/lib/status';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoTrayDraw } from '@views/lotto/ui/LottoTrayDraw';
import { LottoTrayTicket } from '@views/lotto/ui/LottoTrayTicket';

export function LottoTray() {
  const { ticket, singleDraw } = useLottoContext();
  const draw = freshDrawOf(singleDraw, ticket);

  return (
    <div className="flex justify-center rounded-2xl bg-surface-primary px-2 py-3 sm:py-4 short-landscape:py-2.5 dark:bg-border-medium">
      {draw ? <LottoTrayDraw key={draw.round} draw={draw} /> : <LottoTrayTicket />}
    </div>
  );
}
