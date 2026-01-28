import { formatTime } from "@features/sudoku-game/model/utils";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { cn } from "@shared/model/utils";
import { useCallback, useEffect } from "react";
import { AiOutlinePause } from "react-icons/ai";
import { VscPlay } from "react-icons/vsc";

const getButtonStyles = (isCompleted: boolean, timerActive: boolean) => {
  if (isCompleted) {
    return "bg-[rgb(229,229,234)] text-[rgb(142,142,147)] cursor-not-allowed";
  }
  if (timerActive) {
    return "bg-[rgb(245,245,247)] text-[rgb(99,99,102)] hover:bg-[rgb(235,235,240)] active:scale-95";
  }
  return "bg-[rgb(0,122,255)] text-white hover:bg-[rgb(0,110,230)] active:scale-95";
};

export const TimerControl = () => {
  const currentTime = useSudokuStore((state) => state.currentTime);
  const timerActive = useSudokuStore((state) => state.timerActive);
  const incrementTimer = useSudokuStore((state) => state.incrementTimer);
  const toggleTimer = useSudokuStore((state) => state.toggleTimer);
  const isCompleted = useSudokuStore((state) => state.isCompleted);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (timerActive) {
      timer = setInterval(() => {
        incrementTimer();
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerActive, incrementTimer]);

  const handleToggleTimer = useCallback(() => {
    toggleTimer(!timerActive);
  }, [timerActive, toggleTimer]);

  return (
    <div className="flex items-center gap-3">
      {/* Timer Display */}
      <div
        className={cn(
          "text-lg font-mono font-medium tracking-wide",
          "text-[rgb(28,28,30)]",
          "font-tabular",
        )}
      >
        {formatTime(currentTime)}
      </div>

      {/* Play/Pause Button */}
      <button
        className={cn(
          "w-9 h-9 rounded-full",
          "flex items-center justify-center",
          "transition-all duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(0,122,255)]/30",
          getButtonStyles(isCompleted, timerActive),
        )}
        disabled={isCompleted}
        onClick={handleToggleTimer}
      >
        {timerActive ? <AiOutlinePause size={16} /> : <VscPlay size={16} />}
      </button>
    </div>
  );
};
