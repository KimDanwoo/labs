import { useSudokuStore } from "@entities/sudoku/model/store";
import IconButton from "@entities/sudoku/ui/IconButton";
import { CiEraser } from "react-icons/ci";

export const RemoveNumber = () => {
  const fillCell = useSudokuStore((state) => state.fillCell);
  const timerActive = useSudokuStore((state) => state.timerActive);
  return <IconButton icon={<CiEraser className=" text-lg" />} onClick={() => fillCell(null)} disabled={!timerActive} />;
};
