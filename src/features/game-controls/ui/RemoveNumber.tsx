import { useSudokuStore } from "@features/game-controls/model/stores";
import { IconButton } from "@shared/ui";
import { CiEraser } from "react-icons/ci";

export const RemoveNumber = () => {
  const fillCell = useSudokuStore((state) => state.fillCell);
  const timerActive = useSudokuStore((state) => state.timerActive);
  return <IconButton icon={<CiEraser className=" text-lg" />} onClick={() => fillCell(null)} disabled={!timerActive} />;
};
