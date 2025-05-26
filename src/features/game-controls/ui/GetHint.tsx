import { useSudokuStore } from "@features/game-controls/model/stores";
import { IconButton } from "@shared/ui";
import { GoLightBulb } from "react-icons/go";

export const GetHint = () => {
  const getHint = useSudokuStore((state) => state.getHint);
  const timerActive = useSudokuStore((state) => state.timerActive);

  return <IconButton icon={<GoLightBulb className=" text-lg" />} onClick={() => getHint()} disabled={!timerActive} />;
};
