'use client';

import React, { useState } from 'react';
import { useSudokuStore } from '@entities/sudoku/model/store';

interface NumberButtonProps {
  value: number;
  onNumberSelect: (value: number) => void;
  onNoteToggle: (value: number) => void;
  isNoteMode: boolean;
}

const NumberButton: React.FC<NumberButtonProps> = ({
  value,
  onNumberSelect,
  onNoteToggle,
  isNoteMode,
}) => {
  const handleClick = () => {
    if (isNoteMode) {
      onNoteToggle(value);
    } else {
      onNumberSelect(value);
    }
  };

  return (
    <button
      className="lg:w-30 lg:h-30 md:w-10 md:h-10 bg-gray-200 rounded-md flex items-center justify-center text-xl font-semibold hover:bg-gray-300 transition-colors"
      onClick={handleClick}
    >
      {value}
    </button>
  );
};

export const SelectNumber: React.FC = () => {
  const { fillCell, toggleNote } = useSudokuStore();
  const [isNoteMode, setIsNoteMode] = useState(false);

  const handleNumberSelect = (value: number) => {
    fillCell(value);
  };

  const handleEraseClick = () => {
    fillCell(null);
  };

  const handleNoteModeToggle = () => {
    setIsNoteMode(!isNoteMode);
  };

  return (
    <div className="flex flex-col gap-4 items-center mt-6">
      <div className="flex gap-2 flex-wrap justify-center">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <NumberButton
            key={num}
            value={num}
            onNumberSelect={handleNumberSelect}
            onNoteToggle={toggleNote}
            isNoteMode={isNoteMode}
          />
        ))}
      </div>

      <div className="flex gap-4">
        <button
          className={`px-4 py-2 rounded-md transition-colors ${
            isNoteMode ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
          onClick={handleNoteModeToggle}
        >
          노트 모드
        </button>

        <button
          className="px-4 py-2 rounded-md bg-red-100 hover:bg-red-200 transition-colors"
          onClick={handleEraseClick}
        >
          지우기
        </button>
      </div>
    </div>
  );
};

export default SelectNumber;