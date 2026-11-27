import { memo } from 'react';
import { AiOutlinePause } from 'react-icons/ai';
import { VscPlay } from 'react-icons/vsc';

import { TIMER_BUTTON_TONE, TIMER_COPY } from '@entities/sudoku/config/timer';
import { useGameTimer } from '@entities/sudoku/model/sudoku-game/hooks/useGameTimer';
import { CircleButton } from '@shared/ui/circle-button';
import { StatusPill } from '@shared/ui/status-pill';

export const TimerControl = memo(() => {
  const { formattedTime, timerActive, isCompleted, state, toggle } = useGameTimer();

  return (
    <div className="flex items-center gap-2">
      <StatusPill.Root role="timer" aria-label={TIMER_COPY.elapsed} className="min-w-[88px]">
        {formattedTime}
      </StatusPill.Root>
      <CircleButton
        size="l"
        className={TIMER_BUTTON_TONE[state]}
        aria-label={timerActive ? TIMER_COPY.pause : TIMER_COPY.play}
        disabled={isCompleted}
        onClick={toggle}
      >
        {timerActive ? <AiOutlinePause /> : <VscPlay />}
      </CircleButton>
    </div>
  );
});

TimerControl.displayName = 'TimerControl';
