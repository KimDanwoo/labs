import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { cn } from "@shared/model/utils";
import { useShallow } from "zustand/react/shallow";
import { FC } from "react";
import { VscPlay } from "react-icons/vsc";

export const PauseGameOverlay: FC = () => {
  const {
    timerActive, isCompleted, toggleTimer,
    initializeGame, difficulty,
  } = useSudokuStore(
    useShallow((state) => ({
      timerActive: state.timerActive,
      isCompleted: state.isCompleted,
      toggleTimer: state.toggleTimer,
      initializeGame: state.initializeGame,
      difficulty: state.difficulty,
    })),
  );

  if (timerActive || isCompleted) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-20",
        "flex flex-col items-center justify-center gap-6",
        "bg-[rgb(var(--color-glass))]/[var(--overlay-opacity)] backdrop-blur-md",
      )}
    >
      <button
        aria-label="게임 계속하기"
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
            "bg-gradient-to-b from-[rgb(var(--color-gradient-from))] to-[rgb(var(--color-gradient-to))]",
            "shadow-[0_8px_32px_rgba(var(--color-gradient-from),0.4)]",
            "flex items-center justify-center",
            "transition-shadow duration-300",
            "hover:shadow-[0_12px_40px_rgba(var(--color-gradient-from),0.5)]",
          )}
        >
          <VscPlay className="text-white text-3xl ml-1" />
        </div>
        <span className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">탭하여 계속하기</span>
      </button>

      <button
        onClick={() => initializeGame(difficulty)}
        className={cn(
          "px-6 py-2.5 rounded-xl",
          "text-sm font-medium",
          "text-[rgb(var(--color-text-secondary))]",
          "bg-[rgb(var(--color-surface-primary))]/60",
          "border border-[rgb(var(--color-border-light))]/50",
          "transition-all duration-200",
          "hover:bg-[rgb(var(--color-surface-primary))]",
          "hover:text-[rgb(var(--color-text-primary))]",
          "active:scale-95",
        )}
      >
        새 게임
      </button>
    </div>
  );
};

export default PauseGameOverlay;
