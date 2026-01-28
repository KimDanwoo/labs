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
        "flex flex-col items-center justify-center gap-8",
        "bg-white/95 backdrop-blur-sm rounded-xl",
      )}
    >
      <CompletedBoard />
      <GameDifficultySelector.List />
    </div>
  );
};

export default CompleteGameOverlay;
