import { CLASSIC_MODE, KILLER_MODE, useSudokuStore } from "@entities/sudoku/model";
import React from "react";

const GameModeSelector: React.FC = () => {
  const gameMode = useSudokuStore((state) => state.gameMode);
  const switchGameMode = useSudokuStore((state) => state.switchGameMode);

  return (
    <div className="flex gap-2">
      <button
        className={`p-2 ${gameMode === CLASSIC_MODE ? "active" : ""}`}
        onClick={() => switchGameMode(CLASSIC_MODE)}
      >
        클래식
      </button>
      <button className={`p-2 ${gameMode === KILLER_MODE ? "active" : ""}`} onClick={() => switchGameMode(KILLER_MODE)}>
        킬러
      </button>
    </div>
  );
};

export default GameModeSelector;
