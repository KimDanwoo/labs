import { GameDifficultySelector, TimerControl } from "@features/sudoku-game/ui";
import { FC } from "react";

export const GameStatus: FC = () => (
  <div className="w-full flex items-center justify-between">
    <GameDifficultySelector.Select />
    <TimerControl />
  </div>
);

export default GameStatus;
