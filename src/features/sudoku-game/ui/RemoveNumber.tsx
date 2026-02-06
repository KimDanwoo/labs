import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { IconButton } from "@shared/ui";
import { LuEraser } from "react-icons/lu";

export const RemoveNumber = () => {
  const timerActive = useSudokuStore((state) => state.timerActive);
  const fillCell = useSudokuStore((state) => state.fillCell);

  return (
    <IconButton
      icon={<LuEraser strokeWidth={2} />}
      label="지우기"
      onClick={() => fillCell(null)}
      disabled={!timerActive}
    />
  );
};
