import { GameDifficultySelector, TimerControl } from "@features/game-controls/ui";
import { FC } from "react";

export const GameStatus: FC = () => (
  <div className="w-full flex justify-between py-4">
    <GameDifficultySelector.Select />

    <TimerControl />
  </div>
);

export default GameStatus;
