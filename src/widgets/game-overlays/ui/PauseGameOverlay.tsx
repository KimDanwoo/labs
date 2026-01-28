import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { cn } from "@shared/model/utils";
import { FC } from "react";
import { VscPlay } from "react-icons/vsc";

export const PauseGameOverlay: FC = () => {
  const timerActive = useSudokuStore((state) => state.timerActive);
  const isCompleted = useSudokuStore((state) => state.isCompleted);
  const toggleTimer = useSudokuStore((state) => state.toggleTimer);

  if (timerActive || isCompleted) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-20",
        "flex items-center justify-center",
        "bg-white/95 backdrop-blur-sm rounded-xl",
      )}
    >
      <button
        onClick={() => toggleTimer()}
        className={cn(
          "flex flex-col items-center gap-3 p-8 rounded-2xl",
          "transition-all duration-200",
          "hover:bg-[rgb(245,245,247)] active:scale-95",
        )}
      >
        <div
          className={cn(
            "w-20 h-20 rounded-full",
            "bg-[rgb(0,122,255)] shadow-lg shadow-[rgb(0,122,255)]/25",
            "flex items-center justify-center",
          )}
        >
          <VscPlay className="text-white text-3xl ml-1" />
        </div>
        <span className="text-sm font-medium text-[rgb(99,99,102)]">Tap to resume</span>
      </button>
    </div>
  );
};

export default PauseGameOverlay;
