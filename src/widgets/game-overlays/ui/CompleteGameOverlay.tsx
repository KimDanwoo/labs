import { CompletedBoard } from "@features/game-board/ui";
import { useSudokuStore } from "@features/game-controls/model/stores";
import GameDifficultySelector from "@features/game-settings/ui/GameDifficultySelector";
import { FC } from "react";

export const CompleteGameOverlay: FC = () => {
  const isCompleted = useSudokuStore((state) => state.isCompleted);

  if (!isCompleted) return null;

  return (
    <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center gap-8">
      <CompletedBoard />

      <GameDifficultySelector.List />
    </div>
  );
};

export default CompleteGameOverlay;
