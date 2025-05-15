'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// 동적으로 컴포넌트를 불러와 하이드레이션 오류 방지
const SudokuBoard = dynamic(
  () => import('@widgets/sudoku-board/ui/SudokuBoard'),
  { ssr: false }
);

const SelectNumber = dynamic(
  () => import('@features/select-number/ui/SelectNumber'),
  { ssr: false }
);

const Controls = dynamic(
  () => import('@widgets/controls/ui/Controls'),
  { ssr: false }
);

const GameStatus = dynamic(
  () => import('@widgets/game-status/ui/GameStatus'),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">스도쿠 게임</h1>
      
      <div className="mx-auto p-6  rounded-lg flex flex-col lg:flex-row">
        <div>
          <GameStatus />
          <SudokuBoard />
        </div>
        <div className='lg:max-w-[400px]'>
          <Controls />
          <SelectNumber />
        </div>
      </div>
    </main>
  );
}