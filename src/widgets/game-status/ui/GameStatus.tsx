'use client';

import React, { useEffect } from 'react';
import { useSudokuStore } from '@entities/sudoku/model/store';
import { formatTime } from '@entities/sudoku/model/utils';

export const GameStatus: React.FC = () => {
  const {
    isCompleted,
    isSuccess,
    currentTime,
    timerActive,
    incrementTimer,
    difficulty,
  } = useSudokuStore();

  // 타이머 로직
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (timerActive) {
      timer = setInterval(() => {
        incrementTimer();
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerActive, incrementTimer]);

  // 난이도 텍스트 매핑
  const difficultyText = {
    easy: '쉬움',
    medium: '중간',
    hard: '어려움',
    expert: '전문가',
  }[difficulty];

  return (
    <div className="flex flex-col items-center gap-2 mb-6">
      <div className="flex justify-between w-full max-w-md px-4">
        <div className="font-semibold">난이도: {difficultyText}</div>
        <div className="text-xl font-mono">{formatTime(currentTime)}</div>
      </div>

      {isCompleted && (
        <div
          className={`mt-4 p-4 rounded-md ${
            isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          } text-center w-full max-w-md`}
        >
          {isSuccess
            ? '축하합니다! 스도쿠를 성공적으로 완료했습니다! 🎉'
            : '스도쿠가 정확하지 않습니다. 다시 확인해보세요. ⚠️'}
        </div>
      )}
    </div>
  );
};

export default GameStatus;