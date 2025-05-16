"use client";

import { useSudokuStore } from "@entities/sudoku/model/store"; // 스토어 경로에 맞게 수정
import { SudokuCell as SudokuCellType } from "@entities/sudoku/model/types";
import React from "react";

interface CellProps {
  cell: SudokuCellType;
  row: number;
  col: number;
  onSelect: (row: number, col: number) => void;
}

export const SudokuCell: React.FC<CellProps> = ({ cell, row, col, onSelect }) => {
  // 스토어에서 하이라이트 정보 가져오기
  const highlightedCells = useSudokuStore((state) => state.highlightedCells);
  const cellKey = `${row}-${col}`;
  const highlight = highlightedCells[cellKey] || { selected: false, related: false, sameValue: false };

  const handleClick = () => {
    onSelect(row, col);
  };

  // 테두리 스타일링을 위한 조건
  const isRightBorder = (col + 1) % 3 === 0 && col < 8;
  const isBottomBorder = (row + 1) % 3 === 0 && row < 8;

  // 하이라이트 스타일 계산
  let highlightStyle = "";

  // 우선순위: 선택된 셀 > 같은 값 > 관련 셀
  if (highlight.selected) {
    highlightStyle = "bg-blue-500 text-white"; // 선택된 셀
  } else if (highlight.sameValue) {
    highlightStyle = "bg-blue-300"; // 같은 값
  } else if (highlight.related) {
    highlightStyle = "bg-blue-100"; // 관련 셀 (행, 열, 블록)
  }

  return (
    <div
      className={`
        relative flex items-center justify-center
        w-8 h-8 border border-gray-300 cursor-pointer
        md:w-15 md:h-15
        ${isRightBorder ? "border-r-2 border-r-gray-700" : ""}
        ${isBottomBorder ? "border-b-2 border-b-gray-700" : ""}
        ${cell.isConflict ? "text-red-600" : ""}
        ${cell.isInitial ? "font-bold" : "font-normal"}
        ${highlightStyle}
        transition-colors duration-150
      `}
      onClick={handleClick}
    >
      {cell.value ? (
        <span className={`text-xl ${highlight.selected ? "text-white" : ""}`}>{cell.value}</span>
      ) : (
        <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <div key={num} className="flex items-center justify-center">
              {cell.notes.includes(num) && (
                <span className={`text-xs ${highlight.selected ? "text-white" : "text-gray-500"}`}>{num}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
