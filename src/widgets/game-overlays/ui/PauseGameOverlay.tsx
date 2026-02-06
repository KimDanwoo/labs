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
        "bg-white/90 backdrop-blur-md rounded-2xl",
      )}
    >
      <button
        onClick={() => toggleTimer()}
        className={cn(
          "flex flex-col items-center gap-4 p-8 rounded-3xl",
          "transition-all duration-300",
          "hover:scale-105 active:scale-95",
        )}
      >
        <div
          className={cn(
            "w-20 h-20 rounded-full",
            "bg-gradient-to-b from-blue-500 to-blue-600",
            "shadow-[0_8px_32px_rgba(59,130,246,0.4)]",
            "flex items-center justify-center",
            "transition-shadow duration-300",
            "hover:shadow-[0_12px_40px_rgba(59,130,246,0.5)]",
          )}
        >
          <VscPlay className="text-white text-3xl ml-1" />
        </div>
        <span className="text-sm font-medium text-slate-500">탭하여 계속하기</span>
      </button>
    </div>
  );
};

export default PauseGameOverlay;
