import { CompletedBoard, GameDifficultySelector } from "@features/sudoku-game/ui";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { cn } from "@shared/model/utils";
import { FC } from "react";

export const CompleteGameOverlay: FC = () => {
  const isCompleted = useSudokuStore((state) => state.isCompleted);

  if (!isCompleted) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-20",
        "flex flex-col items-center justify-center gap-6",
        "bg-[rgb(var(--color-glass))]/[var(--overlay-opacity)] backdrop-blur-md rounded-2xl",
      )}
    >
      <CompletedBoard />
      <GameDifficultySelector.List />
    </div>
  );
};

export default CompleteGameOverlay;
