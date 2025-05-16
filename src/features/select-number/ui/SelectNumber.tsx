"use client";

import { useSudokuStore } from "@entities/sudoku/model/store";
import React from "react";

interface NumberButtonProps {
  value: number;
  onNumberSelect: (value: number) => void;
  onNoteToggle: (value: number) => void;
  isNoteMode: boolean;
}

const NumberButton: React.FC<NumberButtonProps> = ({ value, onNumberSelect, onNoteToggle, isNoteMode }) => {
  const handleClick = () => {
    if (isNoteMode) {
      onNoteToggle(value);
    } else {
      onNumberSelect(value);
    }
  };

  return (
    <button
      className="w-6 h-6 md:w-10 md:h-10 lg:w-30 lg:h-30  rounded-full flex items-center justify-center text-xl font-semibold hover:bg-gray-300 transition-colors"
      onClick={handleClick}
    >
      {value}
    </button>
  );
};

export const SelectNumber: React.FC = () => {
  const { isNoteMode, fillCell, toggleNote } = useSudokuStore();

  const handleNumberSelect = (value: number) => {
    fillCell(value);
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
    </div>
  );
};

export default SelectNumber;
