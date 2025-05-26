import { useSudokuStore } from "@features/game-controls/model/stores/sudokuStore";
import IconButton from "@shared/ui/IconButton";
import { IoRefresh } from "react-icons/io5";

export const RestartGame = () => {
  const timerActive = useSudokuStore((state) => state.timerActive);
  const resetUserInputs = useSudokuStore((state) => state.resetUserInputs);
  return <IconButton icon={<IoRefresh className=" text-lg" />} onClick={resetUserInputs} disabled={!timerActive} />;
};
