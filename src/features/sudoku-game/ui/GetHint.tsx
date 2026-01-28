import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { IconButton } from "@shared/ui";
import { GoLightBulb } from "react-icons/go";

export const GetHint = () => {
  const getHint = useSudokuStore((state) => state.getHint);
  const timerActive = useSudokuStore((state) => state.timerActive);
  const hintsRemaining = useSudokuStore((state) => state.hintsRemaining);

  return (
    <IconButton
      icon={<GoLightBulb />}
      label={`Hint (${hintsRemaining})`}
      onClick={() => getHint()}
      disabled={!timerActive || hintsRemaining <= 0}
    />
  );
};
