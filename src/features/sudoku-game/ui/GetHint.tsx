import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { IconButton } from "@shared/ui";
import { useShallow } from "zustand/react/shallow";
import { LuLightbulb } from "react-icons/lu";

export const GetHint = () => {
  const { getHint, timerActive, hintsRemaining } = useSudokuStore(
    useShallow((state) => ({
      getHint: state.getHint,
      timerActive: state.timerActive,
      hintsRemaining: state.hintsRemaining,
    })),
  );

  return (
    <IconButton
      icon={<LuLightbulb strokeWidth={2} />}
      label="힌트"
      onClick={() => getHint()}
      disabled={!timerActive || hintsRemaining <= 0}
      badge={hintsRemaining}
    />
  );
};
