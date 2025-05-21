import { GAME_MODE } from "@entities/sudoku/model/constants";
import { useSudokuStore } from "@entities/sudoku/model/store";
import React from "react";

const GameModeSelector: React.FC = () => {
  const gameMode = useSudokuStore((state) => state.gameMode);
  const switchGameMode = useSudokuStore((state) => state.switchGameMode);

  return (
    <div className="flex gap-2">
      <button
        className={`p-2 ${gameMode === GAME_MODE.CLASSIC ? "active" : ""}`}
        onClick={() => switchGameMode(GAME_MODE.CLASSIC)}
      >
        클래식
      </button>
      <button
        className={`p-2 ${gameMode === GAME_MODE.KILLER ? "active" : ""}`}
        onClick={() => switchGameMode(GAME_MODE.KILLER)}
      >
        킬러
      </button>
    </div>
  );
};

export default GameModeSelector;
