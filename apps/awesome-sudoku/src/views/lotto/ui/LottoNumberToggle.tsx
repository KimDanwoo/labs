import { cn } from '@shared/lib/cn';
import { BALL_POP_CLASS, NUMBER_CELL_CLASS, NUMBER_DISC_CLASS, NUMBER_FOCUS_CLASS } from '@views/lotto/config/style';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoBall } from '@views/lotto/ui/LottoBall';

interface LottoNumberToggleProps {
  number: number;
}

export function LottoNumberToggle({ number }: LottoNumberToggleProps) {
  const { ticket, isTicketComplete, isSimulating, toggleNumber } = useLottoContext();
  const isPicked = ticket.includes(number);
  const isFull = isTicketComplete && !isPicked;
  const isDisabled = isSimulating || isFull;
  const handleClick = () => toggleNumber(number);

  return (
    <button
      type="button"
      aria-pressed={isPicked}
      disabled={isDisabled}
      onClick={handleClick}
      className={NUMBER_CELL_CLASS}
    >
      {isPicked ? (
        <LottoBall number={number} size="fill" className={cn(BALL_POP_CLASS, NUMBER_FOCUS_CLASS)} />
      ) : (
        <span className={cn(NUMBER_DISC_CLASS, NUMBER_FOCUS_CLASS)}>{number}</span>
      )}
    </button>
  );
}
