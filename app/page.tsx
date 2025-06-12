"use client";

import { GameModeSelector, SelectNumber } from "@features/game-controls/ui";
import { SudokuBoard } from "@widgets/game-board/ui";
import { Controls } from "@widgets/game-controls/ui";
import { GameStatus } from "@widgets/game-header/ui";
import { CompleteGameOverlay, PauseGameOverlay } from "@widgets/game-overlays/ui";

/**
 * Renders the main layout for the Sudoku game interface, composing the game board, controls, overlays, and mode selector.
 *
 * @returns The complete JSX structure for the Sudoku home page.
 */
export default function Home() {
  return (
    <main className="min-w-[380px] min-h-screen flex flex-col gap-6">
      <GameModeSelector />

      <div className="mx-auto p-6  rounded-lg flex flex-col lg:flex-row">
        <div className="relative">
          <GameStatus />

          <div className="relative">
            <CompleteGameOverlay />

            <PauseGameOverlay />

            <SudokuBoard />
          </div>
        </div>
        <div className="lg:max-w-[380px]">
          <Controls />

          <SelectNumber />
        </div>
      </div>
    </main>
  );
}
