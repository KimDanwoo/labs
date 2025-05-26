"use client";

import { KEY_NUMBER } from "@entities/board/model/constants";
import { useSudokuStore } from "@entities/sudoku/model/stores";
import { NumberButton } from "@shared/ui/NumberButton";
import React from "react";

export const SelectNumber: React.FC = () => {
  const isNoteMode = useSudokuStore((state) => state.isNoteMode);
  const fillCell = useSudokuStore((state) => state.fillCell);
  const toggleNote = useSudokuStore((state) => state.toggleNote);
  const numberCounts = useSudokuStore((state) => state.numberCounts);
  const timerActive = useSudokuStore((state) => state.timerActive);

  const handleNumberSelect = (value: number) => {
    fillCell(value);
  };

  const isNumberDisabled = (value: number) => numberCounts[value] >= 9;

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
            isDisabled={isNumberDisabled(num) || !timerActive}
          />
        ))}
      </div>
    </div>
  );
};

export default SelectNumber;
