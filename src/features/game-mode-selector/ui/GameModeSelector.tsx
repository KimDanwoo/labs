import { CLASSIC_MODE, KILLER_MODE, useSudokuStore } from "@entities/sudoku/model";
import React from "react";

const GameModeSelector: React.FC = () => {
  const gameMode = useSudokuStore((state) => state.gameMode);
  const switchGameMode = useSudokuStore((state) => state.switchGameMode);

  return (
    <div className="game-mode-selector">
      <h3>게임 모드</h3>
      <div className="mode-buttons">
        <button
          className={`mode-button ${gameMode === CLASSIC_MODE ? "active" : ""}`}
          onClick={() => switchGameMode(CLASSIC_MODE)}
        >
          클래식
        </button>
        <button
          className={`mode-button ${gameMode === KILLER_MODE ? "active" : ""}`}
          onClick={() => switchGameMode(KILLER_MODE)}
        >
          킬러
        </button>
      </div>
    </div>
  );
};

export default GameModeSelector;
