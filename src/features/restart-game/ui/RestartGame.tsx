import { useSudokuStore } from "@entities/sudoku/model";
import IconButton from "@entities/sudoku/ui/IconButton";
import { IoRefresh } from "react-icons/io5";

export const RestartGame = () => {
  const { resetUserInputs } = useSudokuStore();
  return <IconButton icon={<IoRefresh className=" text-lg" />} onClick={resetUserInputs} />;
};
