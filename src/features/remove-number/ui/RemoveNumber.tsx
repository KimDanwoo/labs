import { useSudokuStore } from "@entities/sudoku/model";
import IconButton from "@entities/sudoku/ui/IconButton";
import { CiEraser } from "react-icons/ci";

export const RemoveNumber = () => {
  const { fillCell } = useSudokuStore();
  return <IconButton icon={<CiEraser className=" text-lg" />} onClick={() => fillCell(null)} />;
};
