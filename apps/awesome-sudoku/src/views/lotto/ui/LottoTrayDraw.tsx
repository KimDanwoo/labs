import { LOTTO_COPY } from '@views/lotto/config/copy';
import { LOTTO_PICK_COUNT } from '@views/lotto/config/lotto';
import { BALL_ROLL_IN_CLASS } from '@views/lotto/config/style';
import { drawEmphasisOf, revealStyleOf } from '@views/lotto/lib/simulationView';
import type { SingleDraw } from '@views/lotto/model/hooks/useSingleDraw';
import { LottoBall } from '@views/lotto/ui/LottoBall';
import { LottoTrayDivider } from '@views/lotto/ui/LottoTrayDivider';

interface LottoTrayDrawProps {
  draw: SingleDraw;
}

export function LottoTrayDraw({ draw: { ticket, draw } }: LottoTrayDrawProps) {
  return (
    <ol aria-label={LOTTO_COPY.winningLabel} className="flex items-center gap-1.5 sm:gap-2.5">
      {draw.numbers.map((number, index) => (
        <li key={number} className="flex">
          <LottoBall
            number={number}
            size="tray"
            emphasis={drawEmphasisOf(ticket, number)}
            className={BALL_ROLL_IN_CLASS}
            style={revealStyleOf(index)}
          />
        </li>
      ))}
      <LottoTrayDivider />
      <li className="flex">
        <span className="sr-only">{LOTTO_COPY.bonusLabel}</span>
        <LottoBall
          number={draw.bonus}
          size="tray"
          emphasis={drawEmphasisOf(ticket, draw.bonus)}
          className={BALL_ROLL_IN_CLASS}
          style={revealStyleOf(LOTTO_PICK_COUNT)}
        />
      </li>
    </ol>
  );
}
