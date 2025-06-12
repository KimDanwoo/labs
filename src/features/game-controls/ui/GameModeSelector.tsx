import { GAME_MODE } from "@entities/game/model/constants";
import { useSudokuStore } from "@features/game-controls/model/stores";
import { cn } from "@shared/model/utils";
import React from "react";

const gameModes = [
  {
    label: "클래식",
    value: GAME_MODE.CLASSIC,
  },
  {
    label: "킬러",
    value: GAME_MODE.KILLER,
  },
];

export const GameModeSelector: React.FC = () => {
  const gameMode = useSudokuStore((state) => state.gameMode);
  const switchGameMode = useSudokuStore((state) => state.switchGameMode);
  const isActive = (value: (typeof gameModes)[number]["value"]) => gameMode === value;

  return (
    <ul className="flex">
      {gameModes.map(({ value, label }) => (
        <li
          key={value}
          className={cn("border-b-2 hover:bg-blue-100", isActive(value) ? "border-b-blue-400" : "border-b-blue-100")}
        >
          <button className={`px-4 py-2 ${isActive(value) ? "active" : ""}`} onClick={() => switchGameMode(value)}>
            {label}
          </button>
        </li>
      ))}
    </ul>
  );
};
