"use client";

import dynamic from "next/dynamic";

const SudokuBoard = dynamic(() => import("@widgets/sudoku-board/ui/SudokuBoard"), { ssr: false });

const SelectNumber = dynamic(() => import("@features/select-number/ui/SelectNumber"), { ssr: false });

const Controls = dynamic(() => import("@widgets/controls/ui/Controls"), { ssr: false });

const GameStatus = dynamic(() => import("@widgets/game-status/ui/GameStatus"), { ssr: false });

export default function Home() {
  return (
    <main className="min-w-[400px] min-h-screen flex flex-col items-center justify-center">
      <div className="mx-auto p-6  rounded-lg flex flex-col lg:flex-row">
        <div>
          <GameStatus />
          <SudokuBoard />
        </div>
        <div className="lg:max-w-[400px]">
          <Controls />
          <SelectNumber />
        </div>
      </div>
    </main>
  );
}
