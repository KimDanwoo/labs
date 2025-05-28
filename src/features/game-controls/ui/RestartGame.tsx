import { useSudokuStore } from "@features/game-controls/model/stores";
import { IconButton } from "@shared/ui";
import { IoRefresh } from "react-icons/io5";

export const RestartGame = () => {
  const resetUserInputs = useSudokuStore((state) => state.resetUserInputs);
  const timerActive = useSudokuStore((state) => state.timerActive);

  return <IconButton icon={<IoRefresh className=" text-lg" />} onClick={resetUserInputs} disabled={!timerActive} />;
};
