import { memo } from 'react';
import { AiOutlinePause } from 'react-icons/ai';
import { VscPlay } from 'react-icons/vsc';

import { cn } from '@shared/lib/cn';

import { TIMER_ICON_SIZE, TIMER_STATE } from '../../config/timer';
import { useGameTimer } from '../../model/sudoku-game/hooks/useGameTimer';

export const TimerControl = memo(() => {
  const { formattedTime, timerActive, isCompleted, state, toggle } = useGameTimer();

  return (
    <div className="flex items-center gap-2.5">
      <div className="px-3 py-1.5 rounded-lg bg-bg-tertiary/80 backdrop-blur-sm text-base font-semibold tracking-wide text-text-primary font-tabular">
        {formattedTime}
      </div>

      <button
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
          state === TIMER_STATE.completed && 'bg-bg-tertiary text-text-tertiary cursor-not-allowed',
          state === TIMER_STATE.running &&
            'bg-surface-primary/80 text-text-secondary shadow-sm hover:bg-surface-primary hover:text-text-primary active:scale-95',
          state === TIMER_STATE.paused &&
            'bg-linear-to-b from-gradient-from to-gradient-to text-white shadow-[0_4px_12px_rgba(var(--rgb-gradient-from),0.3)] hover:shadow-[0_6px_16px_rgba(var(--rgb-gradient-from),0.4)] active:scale-95',
        )}
        aria-label={timerActive ? '일시정지' : '재생'}
        disabled={isCompleted}
        onClick={toggle}
      >
        {timerActive ? <AiOutlinePause size={TIMER_ICON_SIZE} /> : <VscPlay size={TIMER_ICON_SIZE} />}
      </button>
    </div>
  );
});

TimerControl.displayName = 'TimerControl';
