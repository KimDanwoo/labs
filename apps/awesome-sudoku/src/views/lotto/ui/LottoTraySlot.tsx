import { LOTTO_COPY } from '@views/lotto/config/copy';
import { BALL_POP_CLASS, EMPTY_SLOT_CLASS } from '@views/lotto/config/style';
import { LottoBall } from '@views/lotto/ui/LottoBall';

interface LottoTraySlotProps {
  number: number | null;
}

export function LottoTraySlot({ number }: LottoTraySlotProps) {
  if (number === null) {
    return (
      <span className={EMPTY_SLOT_CLASS}>
        <span className="sr-only">{LOTTO_COPY.emptySlot}</span>
      </span>
    );
  }

  return <LottoBall number={number} size="tray" className={BALL_POP_CLASS} />;
}
