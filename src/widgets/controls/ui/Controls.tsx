"use client";

import { useSudokuStore } from "@entities/sudoku/model/store";
import React from "react";
import { CiEraser } from "react-icons/ci";
import { GoLightBulb, GoPencil } from "react-icons/go";
import { IoRefresh } from "react-icons/io5";

function IconButton({ icon, onClick, className }: { icon: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button className={`px-4 py-4 rounded-full hover:bg-gray-300 transition-colors ${className}`} onClick={onClick}>
      {icon}
    </button>
  );
}

export const Controls: React.FC = () => {
  const { isNoteMode, restartGame, fillCell, toggleNoteMode, getHint } = useSudokuStore();

  const handleEraseClick = () => {
    fillCell(null);
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-6">
      <IconButton className="bg-sky-300" icon={<IoRefresh className="text-white text-lg" />} onClick={restartGame} />

      <IconButton
        className="bg-sky-300"
        icon={<CiEraser className="text-white text-lg" />}
        onClick={handleEraseClick}
      />

      <IconButton
        className="bg-sky-300"
        icon={<GoLightBulb className="text-white text-lg" />}
        onClick={() => getHint()}
      />

      <IconButton
        className={`${isNoteMode ? "bg-sky-300" : "bg-gray-300"}`}
        icon={<GoPencil className="text-white text-lg" />}
        onClick={toggleNoteMode}
      />
    </div>
  );
};

export default Controls;
