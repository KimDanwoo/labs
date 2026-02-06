import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { IconButton } from "@shared/ui";
import { LuLightbulb } from "react-icons/lu";

export const GetHint = () => {
  const getHint = useSudokuStore((state) => state.getHint);
  const timerActive = useSudokuStore((state) => state.timerActive);
  const hintsRemaining = useSudokuStore((state) => state.hintsRemaining);

  return (
    <IconButton
      icon={<LuLightbulb strokeWidth={2} />}
      label="힌트"
      onClick={() => getHint()}
      disabled={!timerActive || hintsRemaining <= 0}
      badge={hintsRemaining}
    />
  );
};
