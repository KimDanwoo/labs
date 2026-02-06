import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { IconButton } from "@shared/ui";
import { LuRotateCcw } from "react-icons/lu";

export const RestartGame = () => {
  const resetUserInputs = useSudokuStore((state) => state.resetUserInputs);
  const timerActive = useSudokuStore((state) => state.timerActive);

  return (
    <IconButton
      icon={<LuRotateCcw strokeWidth={2} />}
      label="다시"
      onClick={resetUserInputs}
      disabled={!timerActive}
    />
  );
};
