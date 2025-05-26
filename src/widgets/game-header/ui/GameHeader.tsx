"use client";

import { GAME_LEVEL } from "@entities/game/model/constants";
import { Difficulty } from "@entities/game/model/types";
import { useSudokuStore } from "@features/game-controls/model/stores/sudokuStore";
import { TimerControl } from "@features/game-controls/ui/TimerControl";
import { FC } from "react";

export const GameStatus: FC = () => {
  const difficulty = useSudokuStore((state) => state.difficulty);
  const isCompleted = useSudokuStore((state) => state.isCompleted);
  const isSuccess = useSudokuStore((state) => state.isSuccess);
  const initializeGame = useSudokuStore((state) => state.initializeGame);

  return (
    <div className="flex flex-col items-center gap-2 mb-6">
      <div className="flex justify-between w-full max-w-md px-4">
        <select
          name="difficulty"
          id="difficulty"
          value={difficulty}
          onChange={(e) => initializeGame(e.target.value as Difficulty)}
        >
          <option value={GAME_LEVEL.EASY}>쉬움</option>
          <option value={GAME_LEVEL.MEDIUM}>중간</option>
          <option value={GAME_LEVEL.HARD}>어려움</option>
          <option value={GAME_LEVEL.EXPERT}>전문가</option>
        </select>

        <TimerControl />
      </div>

      {isCompleted && (
        <div
          className={`mt-4 p-4 rounded-md ${
            isSuccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          } text-center w-full max-w-md`}
        >
          {isSuccess
            ? "축하합니다! 스도쿠를 성공적으로 완료했습니다! 🎉"
            : "스도쿠가 정확하지 않습니다. 다시 확인해보세요. ⚠️"}
        </div>
      )}
    </div>
  );
};

export default GameStatus;
