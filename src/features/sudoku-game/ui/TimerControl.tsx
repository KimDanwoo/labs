import { formatTime } from "@features/sudoku-game/model/utils";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { cn } from "@shared/model/utils";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { AiOutlinePause } from "react-icons/ai";
import { VscPlay } from "react-icons/vsc";

const getButtonStyles = (isCompleted: boolean, timerActive: boolean) => {
  if (isCompleted) {
    return "bg-slate-100 text-slate-400 cursor-not-allowed";
  }
  if (timerActive) {
    return [
      "bg-white/80 text-slate-500 shadow-sm",
      "hover:bg-white hover:text-slate-700 active:scale-95",
    ].join(" ");
  }
  return [
    "bg-gradient-to-b from-blue-500 to-blue-600 text-white",
    "shadow-[0_4px_12px_rgba(59,130,246,0.3)]",
    "hover:shadow-[0_6px_16px_rgba(59,130,246,0.4)] active:scale-95",
  ].join(" ");
};

export const TimerControl = memo(() => {
  const currentTime = useSudokuStore((state) => state.currentTime);
  const timerActive = useSudokuStore((state) => state.timerActive);
  const incrementTimer = useSudokuStore((state) => state.incrementTimer);
  const toggleTimer = useSudokuStore((state) => state.toggleTimer);
  const isCompleted = useSudokuStore((state) => state.isCompleted);

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
          "bg-slate-100/80 backdrop-blur-sm",
          "text-base font-mono font-semibold tracking-wide",
          "text-slate-700",
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
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
          buttonStyles,
        )}
        disabled={isCompleted}
        onClick={handleToggleTimer}
      >
        {timerActive ? <AiOutlinePause size={14} /> : <VscPlay size={14} />}
      </button>
    </div>
  );
});

TimerControl.displayName = "TimerControl";
