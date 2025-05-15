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
    <main className="min-h-screen flex flex-col items-center justify-center py-10 bg-gray-100">
      {/* <h1 className="text-3xl font-bold mb-6">스도쿠 게임</h1> */}
      
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <GameStatus />
        <SudokuBoard />
        <SelectNumber />
        <Controls />
      </div>
      
      {/* <footer className="mt-8 text-center text-gray-500">
        <p>Next.js + TypeScript + Zustand + FSD로 구현한 스도쿠</p>
      </footer> */}
    </main>
  );
}