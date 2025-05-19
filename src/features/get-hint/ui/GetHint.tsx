import { useSudokuStore } from "@entities/sudoku/model";
import IconButton from "@entities/sudoku/ui/IconButton";
import { GoLightBulb } from "react-icons/go";

export const GetHint = () => {
  const getHint = useSudokuStore((state) => state.getHint);
  const timerActive = useSudokuStore((state) => state.timerActive);

  return <IconButton icon={<GoLightBulb className=" text-lg" />} onClick={() => getHint()} disabled={!timerActive} />;
};
