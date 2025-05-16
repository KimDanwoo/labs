"use client";

import { KEY_NUMBER, useSudokuStore } from "@entities/sudoku/model";
import { NumberButton } from "@entities/sudoku/ui/NumberButton";
import React from "react";

export const SelectNumber: React.FC = () => {
  const { isNoteMode, fillCell, toggleNote } = useSudokuStore();

  const handleNumberSelect = (value: number) => {
    fillCell(value);
  };

  return (
    <div className="flex flex-col gap-4 items-center mt-6">
      <div className="flex gap-2 flex-wrap justify-center">
        {KEY_NUMBER.map((num) => (
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
