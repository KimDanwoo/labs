"use client";

import { useSudokuStore } from "@features/game-controls/model/stores";
import { TimerControl } from "@features/game-controls/ui";
import GameDifficultySelector from "@features/game-settings/ui/GameDifficultySelector";
import { FC } from "react";

export const GameStatus: FC = () => {
  const isCompleted = useSudokuStore((state) => state.isCompleted);
  const isSuccess = useSudokuStore((state) => state.isSuccess);

  return (
    <div className="flex flex-col items-center gap-2 mb-6">
      <div className="flex justify-between w-full max-w-md px-4">
        <GameDifficultySelector.Select />

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
