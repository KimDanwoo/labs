import { formatTime } from "@features/sudoku-game/model/utils";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { cn } from "@shared/model/utils";
import { useShallow } from "zustand/react/shallow";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { AiOutlinePause } from "react-icons/ai";
import { VscPlay } from "react-icons/vsc";

const getButtonStyles = (isCompleted: boolean, timerActive: boolean) => {
  if (isCompleted) {
    return "bg-[rgb(var(--color-bg-tertiary))] text-[rgb(var(--color-text-tertiary))] cursor-not-allowed";
  }
  if (timerActive) {
    return [
      "bg-[rgb(var(--color-surface-primary))]/80 text-[rgb(var(--color-text-secondary))] shadow-sm",
      "hover:bg-[rgb(var(--color-surface-primary))] hover:text-[rgb(var(--color-text-primary))] active:scale-95",
    ].join(" ");
  }
  return [
    "bg-gradient-to-b from-[rgb(var(--color-gradient-from))] to-[rgb(var(--color-gradient-to))] text-white",
    "shadow-[0_4px_12px_rgba(var(--color-gradient-from),0.3)]",
    "hover:shadow-[0_6px_16px_rgba(var(--color-gradient-from),0.4)] active:scale-95",
  ].join(" ");
};

export const TimerControl = memo(() => {
  const {
    currentTime, timerActive, incrementTimer,
    toggleTimer, isCompleted,
  } = useSudokuStore(
    useShallow((state) => ({
      currentTime: state.currentTime,
      timerActive: state.timerActive,
      incrementTimer: state.incrementTimer,
      toggleTimer: state.toggleTimer,
      isCompleted: state.isCompleted,
    })),
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerActive && !isCompleted) {
      timerRef.current = setInterval(incrementTimer, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerActive, isCompleted, incrementTimer]);

  const handleToggleTimer = useCallback(() => {
    toggleTimer(!timerActive);
  }, [timerActive, toggleTimer]);

  const formattedTime = useMemo(() => formatTime(currentTime), [currentTime]);

  const buttonStyles = useMemo(
    () => getButtonStyles(isCompleted, timerActive),
    [isCompleted, timerActive],
  );

  return (
    <div className="flex items-center gap-2.5">
      {/* Timer Display */}
      <div
        className={cn(
          "px-3 py-1.5 rounded-lg",
          "bg-[rgb(var(--color-bg-tertiary))]/80 backdrop-blur-sm",
          "text-base font-mono font-semibold tracking-wide",
          "text-[rgb(var(--color-text-primary))]",
          "font-tabular",
        )}
      >
        {formattedTime}
      </div>

      {/* Play/Pause Button */}
      <button
        className={cn(
          "w-8 h-8 rounded-full",
          "flex items-center justify-center",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-accent))]/40",
          buttonStyles,
        )}
        aria-label={timerActive ? "일시정지" : "재생"}
        disabled={isCompleted}
        onClick={handleToggleTimer}
      >
        {timerActive ? <AiOutlinePause size={14} /> : <VscPlay size={14} />}
      </button>
    </div>
  );
});

TimerControl.displayName = "TimerControl";
