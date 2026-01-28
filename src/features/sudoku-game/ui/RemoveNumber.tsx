import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { IconButton } from "@shared/ui";
import { CiEraser } from "react-icons/ci";

export const RemoveNumber = () => {
  const timerActive = useSudokuStore((state) => state.timerActive);
  const fillCell = useSudokuStore((state) => state.fillCell);

  return (
    <IconButton
      icon={<CiEraser />}
      label="Erase"
      onClick={() => fillCell(null)}
      disabled={!timerActive}
    />
  );
};
