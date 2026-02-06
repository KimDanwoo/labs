"use client";

import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { cn } from "@shared/model/utils";
import { memo } from "react";

export const NewGameButton = memo(() => {
  const initializeGame = useSudokuStore((state) => state.initializeGame);
  const difficulty = useSudokuStore((state) => state.difficulty);

  const handleNewGame = () => {
    initializeGame(difficulty);
  };

  return (
    <button
      type="button"
      onClick={handleNewGame}
      className={cn(
        "w-full py-3 md:py-3.5",
        "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500",
        "hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600",
        "text-white font-semibold text-sm md:text-base tracking-wide",
        "rounded-xl md:rounded-2xl",
        "shadow-lg shadow-indigo-500/30",
        "hover:shadow-xl hover:shadow-indigo-500/40",
        "border border-indigo-400/20",
        "transition-all duration-300",
        "active:scale-[0.98]",
        "relative overflow-hidden",
        // Shine effect
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        "before:translate-x-[-200%] hover:before:translate-x-[200%]",
        "before:transition-transform before:duration-700",
      )}
    >
      새 게임
    </button>
  );
});

NewGameButton.displayName = "NewGameButton";
