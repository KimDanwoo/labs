"use client";

import { KEY_NUMBER } from "@entities/board/model/constants";
import { CellProps } from "@entities/cell/model/types";
import { useSudokuStore } from "@entities/sudoku/model/stores";
import { FC } from "react";

export const SudokuCell: FC<CellProps> = ({ cell, row, col, onSelect }) => {
  const highlightedCells = useSudokuStore((state) => state.highlightedCells);
  const cellKey = `${row}-${col}`;
  const highlight = highlightedCells[cellKey] || { selected: false, related: false, sameValue: false };

  const handleClick = () => {
    onSelect(row, col);
  };

  // 테두리 스타일링을 위한 조건
  const isRightBlockBorder = (col + 1) % 3 === 0 && col < 8;
  const isBottomBlockBorder = (row + 1) % 3 === 0 && row < 8;

  // 하이라이트 스타일 계산
  let bgColor = "bg-white";
  let textColor = "text-slate-700";
  let borderColor = "border-slate-200";

  // 우선순위: 선택된 셀 > 같은 값 > 관련 셀
  if (highlight.selected) {
    bgColor = "bg-blue-100";
    textColor = "text-slate-700";
    borderColor = "outline-1 outline-blue-600";
  } else if (highlight.sameValue) {
    bgColor = "bg-blue-300";
  } else if (highlight.related) {
    bgColor = "bg-blue-50";
  }

  if (cell.isConflict) {
    textColor = "text-red-600";
  }

  return (
    <td
      className={`
        relative
        min-w-10 min-h-10
        w-10 h-10 
        md:w-12 md:h-12
        lg:w-14 lg:h-14
        border border-slate-200
        ${isRightBlockBorder ? "border-r-2 border-r-slate-800" : ""}
        ${isBottomBlockBorder ? "border-b-2 border-b-slate-800" : ""}
        ${bgColor}
        ${textColor}
        ${borderColor}
        ${cell.isInitial ? "font-bold" : "font-normal"}
        text-center align-middle
        cursor-pointer
        transition-colors duration-100
      `}
      onClick={handleClick}
    >
      {cell.value ? (
        <span className="text-xl md:text-2xl lg:text-2xl">{cell.value}</span>
      ) : (
        <div className="grid grid-cols-3 grid-rows-3 gap-0 w-full h-full">
          {KEY_NUMBER.map((num) => (
            <div key={num} className="flex items-center justify-center w-full h-full">
              {cell.notes.includes(num) && <span className={"text-[8px] md:text-xs text-slate-500"}>{num}</span>}
            </div>
          ))}
        </div>
      )}
    </td>
  );
};
