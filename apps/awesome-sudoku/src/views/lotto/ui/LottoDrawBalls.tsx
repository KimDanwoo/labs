import { LOTTO_COPY } from '@views/lotto/config/copy';
import { LOTTO_PICK_COUNT } from '@views/lotto/config/lotto';
import { BALL_REVEAL_CLASS } from '@views/lotto/config/style';
import { revealStyleOf } from '@views/lotto/lib/simulationView';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoBall } from '@views/lotto/ui/LottoBall';

export function LottoDrawBalls() {
  const { singleDraw } = useLottoContext();
  if (!singleDraw) return null;
  const { round, ticket, draw } = singleDraw;
  return (
    <ol
      key={round}
      aria-label={LOTTO_COPY.winningNumbers}
      className="flex items-start justify-center gap-1.5 rounded-xl bg-bg-tertiary/70 px-2 pt-4 pb-3 sm:gap-2.5"
    >
      {draw.numbers.map((number, index) => (
        <li key={number} className="flex">
          <LottoBall
            number={number}
            emphasis={ticket.includes(number) ? 'matched' : 'muted'}
            className={BALL_REVEAL_CLASS}
            style={revealStyleOf(index)}
          />
        </li>
      ))}
      <li aria-hidden className="flex h-9 items-center text-lg font-bold text-text-tertiary sm:h-11">
        +
      </li>
      <li className="flex flex-col items-center gap-1">
        <LottoBall
          number={draw.bonus}
          emphasis={ticket.includes(draw.bonus) ? 'matched' : 'muted'}
          className={BALL_REVEAL_CLASS}
          style={revealStyleOf(LOTTO_PICK_COUNT)}
        />
        <span className="text-[11px] text-text-tertiary">{LOTTO_COPY.bonus}</span>
      </li>
    </ol>
  );
}
