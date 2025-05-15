'use client';

import React from 'react';
import { useSudokuStore } from '@entities/sudoku/model/store';

export const Controls: React.FC = () => {
  const { restartGame, checkSolution, initializeGame, toggleTimer, timerActive, getHint } = useSudokuStore();

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-6">
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        onClick={() => initializeGame('easy')}
      >
        쉬움
      </button>

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        onClick={() => initializeGame('medium')}
      >
        중간
      </button>

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        onClick={() => initializeGame('hard')}
      >
        어려움
      </button>

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        onClick={() => getHint()}
      >
        힌트
      </button>

      <button
        className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
        onClick={restartGame}
      >
        재시작
      </button>

      <button
        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        onClick={checkSolution}
      >
        확인
      </button>

      <button
        className={`px-4 py-2 rounded-md transition-colors ${
          timerActive ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'
        }`}
        onClick={() => toggleTimer()}
      >
        {timerActive ? '타이머 정지' : '타이머 시작'}
      </button>
    </div>
  );
};

export default Controls;