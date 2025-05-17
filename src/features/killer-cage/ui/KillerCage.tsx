"use client";

import { KILLER_MODE, useSudokuStore } from "@entities/sudoku/model";
import React, { useEffect, useRef, useState } from "react";

export const KillerCage: React.FC = () => {
  const cages = useSudokuStore((state) => state.cages);
  const gameMode = useSudokuStore((state) => state.gameMode);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [cageInfo, setCageInfo] = useState<{
    paths: { id: number; path: string }[];
    sums: { id: number; sum: number; x: number; y: number }[];
  }>({ paths: [], sums: [] });

  useEffect(() => {
    if (gameMode !== KILLER_MODE) return;

    // 셀 위치 계산 및 케이지 테두리/합계 위치 설정
    const calcPositions = () => {
      // 테이블 찾기
      const table = document.querySelector("table.border-collapse");
      if (!table) return;

      // 테이블 내 모든 셀 찾기
      const cells = table.querySelectorAll("td");
      if (cells.length !== 81) return; // 9x9 스도쿠

      // 셀 위치 정보 저장
      const cellPositions: Record<string, { x: number; y: number; width: number; height: number }> = {};
      cells.forEach((cell, index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const rect = cell.getBoundingClientRect();
        const tableRect = table.getBoundingClientRect();

        cellPositions[`${row}-${col}`] = {
          x: rect.left - tableRect.left,
          y: rect.top - tableRect.top,
          width: rect.width,
          height: rect.height,
        };
      });

      // 테이블 사이즈 기준으로 오버레이 설정
      if (overlayRef.current) {
        const tableRect = table.getBoundingClientRect();
        overlayRef.current.style.width = `${tableRect.width}px`;
        overlayRef.current.style.height = `${tableRect.height}px`;
      }

      // 케이지별 경로 및 합계 위치 계산
      const paths: { id: number; path: string }[] = [];
      const sums: { id: number; sum: number; x: number; y: number }[] = [];

      cages.forEach((cage) => {
        // 케이지 테두리 생성
        const segments: string[] = [];
        const cageCellKeys = new Set(cage.cells.map(([r, c]) => `${r}-${c}`));

        cage.cells.forEach(([row, col]) => {
          const cellKey = `${row}-${col}`;
          const cell = cellPositions[cellKey];
          if (!cell) return;

          // 패딩 계산
          const padding = Math.min(cell.width, cell.height) * 0.1;

          // 상하좌우 인접 셀 확인하여 테두리 생성
          const edges = [
            { r: row - 1, c: col, side: "top" },
            { r: row + 1, c: col, side: "bottom" },
            { r: row, c: col - 1, side: "left" },
            { r: row, c: col + 1, side: "right" },
          ];

          edges.forEach(({ r, c, side }) => {
            const adjKey = `${r}-${c}`;
            if (!cageCellKeys.has(adjKey)) {
              const x = cell.x;
              const y = cell.y;
              const w = cell.width;
              const h = cell.height;

              if (side === "top") {
                segments.push(`M${x + padding},${y + padding} L${x + w - padding},${y + padding}`);
              } else if (side === "right") {
                segments.push(`M${x + w - padding},${y + padding} L${x + w - padding},${y + h - padding}`);
              } else if (side === "bottom") {
                segments.push(`M${x + padding},${y + h - padding} L${x + w - padding},${y + h - padding}`);
              } else if (side === "left") {
                segments.push(`M${x + padding},${y + padding} L${x + padding},${y + h - padding}`);
              }
            }
          });
        });

        paths.push({
          id: cage.id,
          path: segments.join(" "),
        });

        // 케이지의 왼쪽 상단 셀 찾기 (합계 표시 위치)
        let topRow = 9,
          leftCol = 9;
        cage.cells.forEach(([r, c]) => {
          if (r < topRow || (r === topRow && c < leftCol)) {
            topRow = r;
            leftCol = c;
          }
        });

        const sumCell = cellPositions[`${topRow}-${leftCol}`];
        if (sumCell) {
          sums.push({
            id: cage.id,
            sum: cage.sum,
            x: sumCell.x + 2,
            y: sumCell.y + 2,
          });
        }
      });

      setCageInfo({ paths, sums });
    };

    // 초기 계산 및 이벤트 설정
    calcPositions();
    const timers = [setTimeout(calcPositions, 100), setTimeout(calcPositions, 300), setTimeout(calcPositions, 500)];

    // 테이블 변경 감지
    const observer = new MutationObserver(calcPositions);
    const table = document.querySelector("table.border-collapse");
    if (table) {
      observer.observe(table, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }

    // 브라우저 크기 변경 감지
    window.addEventListener("resize", calcPositions);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", calcPositions);
      timers.forEach(clearTimeout);
    };
  }, [cages, gameMode]);

  if (gameMode !== KILLER_MODE || cageInfo.paths.length === 0) {
    return null;
  }

  // 평균 셀 크기 계산 (첫 번째 경로에서 위치 추정)
  const firstPath = cageInfo.paths[0]?.path || "";
  const match = firstPath.match(/M([\d.]+),([\d.]+)/);
  let cellSize = 40; // 기본값

  if (match && cageInfo.paths.length > 1) {
    const secondMatch = cageInfo.paths[1]?.path.match(/M([\d.]+),([\d.]+)/);
    if (secondMatch) {
      const x1 = parseFloat(match[1]);
      const x2 = parseFloat(secondMatch[1]);
      cellSize = Math.max(Math.abs(x2 - x1), 40);
    }
  }

  return (
    <div ref={overlayRef} className="absolute top-0 left-0 pointer-events-none z-10">
      <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
        {cageInfo.paths.map(({ id, path }) => (
          <path
            key={`cage-${id}`}
            d={path}
            fill="none"
            stroke="#436def"
            strokeWidth={1}
            strokeDasharray={"3,3"}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-90"
          />
        ))}
      </svg>

      {cageInfo.sums.map(({ id, sum, x, y }) => (
        <div
          key={`sum-${id}`}
          className="absolute font-medium text-blue-600 z-20"
          style={{
            top: `${y}px`,
            left: `${x}px`,
            fontSize: `${Math.max(0.5, Math.min(0.65, cellSize / 65))}rem`,
            lineHeight: "1",
            backgroundColor: "white",
          }}
        >
          {sum}
        </div>
      ))}
    </div>
  );
};
