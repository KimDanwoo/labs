"use client";

import { UserProfileMenu } from "@entities/auth/ui";
import { GameModeSelector, SelectNumber } from "@features/sudoku-game/ui";
import { SudokuBoard } from "@widgets/game-board/ui";
import { Controls } from "@widgets/game-controls/ui";
import { GameStatus } from "@widgets/game-header/ui";
import { CompleteGameOverlay, PauseGameOverlay } from "@widgets/game-overlays/ui";

export const HomePage = () => (
  <main className="min-h-screen bg-gradient-to-b from-[rgb(250,250,252)] to-white">
    {/* Navigation - Floating glass effect */}
    <nav className="sticky top-0 z-30 glass border-b border-[rgb(229,229,234)]/50">
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
        <GameModeSelector />
        <UserProfileMenu />
      </div>
    </nav>

    {/* Main Content */}
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-center gap-8 lg:gap-12">
        {/* Left Column - Game Board */}
        <div className="flex flex-col items-center">
          {/* Game Status */}
          <div className="w-full mb-6">
            <GameStatus />
          </div>

          {/* Board Container */}
          <div className="relative">
            <CompleteGameOverlay />
            <PauseGameOverlay />
            <SudokuBoard />
          </div>
        </div>

        {/* Right Column - Controls */}
        <div className="flex flex-col gap-8 lg:pt-14">
          {/* Action Controls */}
          <div>
            <h3 className="text-xs font-medium text-[rgb(142,142,147)] uppercase tracking-wider mb-4">
              Actions
            </h3>
            <Controls />
          </div>

          {/* Number Pad */}
          <div>
            <h3 className="text-xs font-medium text-[rgb(142,142,147)] uppercase tracking-wider mb-4">
              Numbers
            </h3>
            <SelectNumber />
          </div>
        </div>
      </div>
    </div>
  </main>
);
