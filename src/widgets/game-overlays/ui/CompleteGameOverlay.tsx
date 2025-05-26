import { GAME_LEVEL } from "@entities/game/model/constants";
import { useSudokuStore } from "@features/game-controls/model/stores/sudokuStore";
import { FC } from "react";

const LEVELS = [
  { label: "쉬움", value: GAME_LEVEL.EASY },
  { label: "중간", value: GAME_LEVEL.MEDIUM },
  { label: "어려움", value: GAME_LEVEL.HARD },
  { label: "매우 어려움", value: GAME_LEVEL.EXPERT },
];

export const CompleteGameOverlay: FC = () => {
  const isCompleted = useSudokuStore((state) => state.isCompleted);
  const initializeGame = useSudokuStore((state) => state.initializeGame);

  if (!isCompleted) return null;

  return (
    <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center">
      <ul className="flex flex-col gap-2 cursor-pointer">
        {LEVELS.map((level) => (
          <li key={level.value} onClick={() => initializeGame(level.value)}>
            {level.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CompleteGameOverlay;
