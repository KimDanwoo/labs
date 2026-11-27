import { cn } from '@shared/lib/cn';
import { NUMBER_TOGGLE_CLASS, NUMBER_TOGGLE_IDLE_CLASS } from '@views/lotto/config/style';
import { LottoBall } from '@views/lotto/ui/LottoBall';

interface LottoNumberToggleProps {
  number: number;
  isPicked: boolean;
  isLocked: boolean;
  isFrozen: boolean;
  onToggle: (number: number) => void;
}

export function LottoNumberToggle({ number, isPicked, isLocked, isFrozen, onToggle }: LottoNumberToggleProps) {
  const isFull = isLocked && !isPicked;
  const isDisabled = isFrozen || isFull;
  const handleClick = () => onToggle(number);
  return (
    <button
      type="button"
      aria-pressed={isPicked}
      disabled={isDisabled}
      onClick={handleClick}
      className={cn(NUMBER_TOGGLE_CLASS, !isPicked && NUMBER_TOGGLE_IDLE_CLASS)}
    >
      {isPicked ? <LottoBall number={number} size="fill" /> : number}
    </button>
  );
}
