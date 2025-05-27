"use client";

import { TimerControl } from "@features/game-controls/ui";
import GameDifficultySelector from "@features/game-settings/ui/GameDifficultySelector";
import { FC } from "react";

export const GameStatus: FC = () => (
  <div className="flex flex-col items-center gap-2 mb-6">
    <div className="flex justify-between w-full max-w-md px-4">
      <GameDifficultySelector.Select />

      <TimerControl />
    </div>
  </div>
);

export default GameStatus;
