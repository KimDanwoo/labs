import { cn } from '@shared/lib/cn';
import { GLASS_LENS_CLASS } from '@views/lotto/config/style';
import { freshDrawOf } from '@views/lotto/lib/status';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoTrayDraw } from '@views/lotto/ui/LottoTrayDraw';
import { LottoTrayTicket } from '@views/lotto/ui/LottoTrayTicket';

export function LottoTray() {
  const { ticket, singleDraw } = useLottoContext();
  const draw = freshDrawOf(singleDraw, ticket);

  return (
    <div className={cn('flex justify-center rounded-2xl px-2 py-3 sm:py-4', GLASS_LENS_CLASS)}>
      {draw ? <LottoTrayDraw key={draw.round} draw={draw} /> : <LottoTrayTicket />}
    </div>
  );
}
