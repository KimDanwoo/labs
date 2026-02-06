import { GAME_MODE } from "@entities/game/model/constants";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { cn } from "@shared/model/utils";
import React, { memo } from "react";

const gameModes = [
  { label: "클래식", value: GAME_MODE.CLASSIC },
  { label: "킬러", value: GAME_MODE.KILLER },
];

export const GameModeSelector: React.FC = memo(() => {
  const gameMode = useSudokuStore((state) => state.gameMode);
  const switchGameMode = useSudokuStore((state) => state.switchGameMode);

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl backdrop-blur-sm">
      {gameModes.map(({ value, label }) => {
        const isActive = gameMode === value;
        return (
          <button
            key={value}
            onClick={() => switchGameMode(value)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium",
              "transition-all duration-200 ease-out",
              isActive
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
});

GameModeSelector.displayName = "GameModeSelector";
