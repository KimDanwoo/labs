"use client";

import { UserProfileMenu } from "@entities/auth/ui";
import { GameModeSelector, SelectNumber } from "@features/game-controls/ui";
import { SudokuBoard } from "@widgets/game-board/ui";
import { Controls } from "@widgets/game-controls/ui";
import { GameStatus } from "@widgets/game-header/ui";
import { CompleteGameOverlay, PauseGameOverlay } from "@widgets/game-overlays/ui";

export default function Home() {
  return (
    <main className="min-w-[320px] min-h-screen flex flex-col gap-4">
      <nav className="flex items-center justify-between px-2 border-b border-gray-200">
        <GameModeSelector />

        <UserProfileMenu />
      </nav>

      <div className="mx-auto px-6 rounded-lg flex flex-col gap-4 lg:flex-row">
        <div className="relative">
          <GameStatus />

          <div className="relative">
            <CompleteGameOverlay />

            <PauseGameOverlay />

            <SudokuBoard />
          </div>
        </div>
        <div className="lg:max-w-[380px] flex flex-col gap-4">
          <Controls />

          <SelectNumber />
        </div>
      </div>
    </main>
  );
}
