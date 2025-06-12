"use client";

import dynamic from "next/dynamic";

const SudokuBoard = dynamic(() => import("@widgets/game-board/ui/GameBoard"), { ssr: false });
const SelectNumber = dynamic(() => import("@features/game-controls/ui/SelectNumber"), { ssr: false });
const Controls = dynamic(() => import("@widgets/game-controls/ui/GameControls"), { ssr: false });
const GameStatus = dynamic(() => import("@widgets/game-header/ui/GameHeader"), { ssr: false });
const GameModeSelector = dynamic(() => import("@features/game-controls/ui/GameModeSelector"), { ssr: false });
const CompleteGameOverlay = dynamic(() => import("@widgets/game-overlays/ui/CompleteGameOverlay"), { ssr: false });
const PauseGameOverlay = dynamic(() => import("@widgets/game-overlays/ui/PauseGameOverlay"), { ssr: false });

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
