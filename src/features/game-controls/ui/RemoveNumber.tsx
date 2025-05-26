import { useSudokuStore } from "@features/game-controls/model/stores/sudokuStore";
import IconButton from "@shared/ui/IconButton";
import { CiEraser } from "react-icons/ci";

export const RemoveNumber = () => {
  const fillCell = useSudokuStore((state) => state.fillCell);
  const timerActive = useSudokuStore((state) => state.timerActive);
  return <IconButton icon={<CiEraser className=" text-lg" />} onClick={() => fillCell(null)} disabled={!timerActive} />;
};
