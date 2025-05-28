import { SUDOKU_CELL_COUNT } from "@entities/board/model/constants";
import { CageInfo } from "@entities/board/model/types";
import { GAME_MODE } from "@entities/game/model/constants";
import { useSudokuStore } from "@features/game-controls/model/stores";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const useKillerCage = () => {
  const cages = useSudokuStore((state) => state.cages);
  const gameMode = useSudokuStore((state) => state.gameMode);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [cageInfo, setCageInfo] = useState<CageInfo>({ paths: [], sums: [] });

  // 타이머와 옵저버 참조 관리
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const observerRef = useRef<MutationObserver | null>(null);
  const isCalculatingRef = useRef(false);

  // 타이머 정리 함수
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // 옵저버 정리 함수
  const clearObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // 전체 정리 함수
  const cleanup = useCallback(() => {
    clearTimers();
    clearObserver();
    isCalculatingRef.current = false;
  }, [clearTimers, clearObserver]);

  // 최적화된 케이지 위치 계산
  const calcPositions = useCallback(() => {
    // 중복 계산 방지
    if (isCalculatingRef.current) return;
    isCalculatingRef.current = true;

    try {
      const table = document.querySelector("table.border-collapse");
      if (!table || gameMode !== GAME_MODE.KILLER) {
        setCageInfo({ paths: [], sums: [] });
        return;
      }

      const cells = table.querySelectorAll("td");
      if (cells.length !== SUDOKU_CELL_COUNT) {
        setCageInfo({ paths: [], sums: [] });
        return;
      }

      const cellPositions: Record<string, { x: number; y: number; width: number; height: number }> = {};
      const tableRect = table.getBoundingClientRect();

      // 셀 위치 계산 최적화
      Array.from(cells).forEach((cell, index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const rect = cell.getBoundingClientRect();

        cellPositions[`${row}-${col}`] = {
          x: rect.left - tableRect.left,
          y: rect.top - tableRect.top,
          width: rect.width,
          height: rect.height,
        };
      });

      // 오버레이 크기 설정
      if (overlayRef.current) {
        overlayRef.current.style.width = `${tableRect.width}px`;
        overlayRef.current.style.height = `${tableRect.height}px`;
      }

      const paths: { id: number; path: string }[] = [];
      const sums: { id: number; sum: number; x: number; y: number }[] = [];
      const processedCageIds = new Set<number>();

      // 케이지 경로 생성 최적화
      cages.forEach((cage) => {
        if (processedCageIds.has(cage.id)) return;
        processedCageIds.add(cage.id);

        const segments: string[] = [];
        const cageCellKeys = new Set(cage.cells.map(([r, c]) => `${r}-${c}`));

        cage.cells.forEach(([row, col]) => {
          const cell = cellPositions[`${row}-${col}`];
          if (!cell) return;

          const padding = Math.min(cell.width, cell.height) * 0.1;
          const { x, y, width: w, height: h } = cell;

          // 경계 검사 및 경로 생성 최적화
          const edges = [
            {
              r: row - 1,
              c: col,
              side: "top",
              path: `M${x + padding},${y + padding} L${x + w - padding},${y + padding}`,
            },
            {
              r: row + 1,
              c: col,
              side: "bottom",
              path: `M${x + padding},${y + h - padding} L${x + w - padding},${y + h - padding}`,
            },
            {
              r: row,
              c: col - 1,
              side: "left",
              path: `M${x + padding},${y + padding} L${x + padding},${y + h - padding}`,
            },
            {
              r: row,
              c: col + 1,
              side: "right",
              path: `M${x + w - padding},${y + padding} L${x + w - padding},${y + h - padding}`,
            },
          ];

          edges.forEach(({ r, c, path }) => {
            if (!cageCellKeys.has(`${r}-${c}`)) {
              segments.push(path);
            }
          });
        });

        if (segments.length > 0) {
          paths.push({
            id: cage.id,
            path: segments.join(" "),
          });
        }

        // 합계 위치 계산
        const topLeftCell = cage.cells.reduce(
          (topLeft, [r, c]) => (r < topLeft[0] || (r === topLeft[0] && c < topLeft[1]) ? [r, c] : topLeft),
          [9, 9],
        );

        const sumCell = cellPositions[`${topLeftCell[0]}-${topLeftCell[1]}`];
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
    } catch (error) {
      throw new Error(`케이지 위치 계산 오류: ${error}`);
      setCageInfo({ paths: [], sums: [] });
    } finally {
      isCalculatingRef.current = false;
    }
  }, [cages, gameMode]);

  // 디바운스된 계산 함수
  const debouncedCalcPositions = useCallback(() => {
    clearTimers();

    // 점진적 계산으로 성능 최적화
    const delays = [50, 150, 300];
    timersRef.current = delays.map((delay) => setTimeout(calcPositions, delay));
  }, [calcPositions, clearTimers]);

  useEffect(() => {
    if (gameMode !== GAME_MODE.KILLER) {
      setCageInfo({ paths: [], sums: [] });
      cleanup();
      return;
    }

    // 초기 계산
    calcPositions();

    // 성능 최적화된 옵저버 설정
    const setupObserver = () => {
      const table = document.querySelector("table.border-collapse");
      if (table && !observerRef.current) {
        observerRef.current = new MutationObserver((mutations) => {
          // 중요한 변경사항만 감지
          const hasRelevantChanges = mutations.some(
            (mutation) =>
              mutation.type === "childList" ||
              (mutation.type === "attributes" && ["class", "style"].includes(mutation.attributeName || "")),
          );

          if (hasRelevantChanges) {
            debouncedCalcPositions();
          }
        });

        observerRef.current.observe(table, {
          attributes: true,
          attributeFilter: ["class", "style"],
          childList: true,
          subtree: true,
        });
      }
    };

    // 지연된 옵저버 설정
    const observerTimer = setTimeout(setupObserver, 100);

    // 리사이즈 이벤트 리스너 (스로틀링 적용)
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(debouncedCalcPositions, 50);
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      clearTimeout(observerTimer);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      cleanup();
    };
  }, [cages, gameMode, calcPositions, debouncedCalcPositions, cleanup]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => cleanup, [cleanup]);

  const hasKillerCage = gameMode === GAME_MODE.KILLER && cageInfo.paths.length > 0;

  // 셀 크기 계산 최적화 (메모화)
  const cellSize = useMemo(() => {
    if (!hasKillerCage || cageInfo.paths.length === 0) return 40;

    try {
      const firstPath = cageInfo.paths[0]?.path || "";
      const match = firstPath.match(/M([\d.]+),([\d.]+)/);

      if (match && cageInfo.paths.length > 1) {
        const secondMatch = cageInfo.paths[1]?.path.match(/M([\d.]+),([\d.]+)/);
        if (secondMatch) {
          const x1 = parseFloat(match[1]);
          const x2 = parseFloat(secondMatch[1]);
          return Math.max(Math.abs(x2 - x1), 40);
        }
      }
    } catch (error) {
      throw new Error(`셀 크기 계산 오류: ${error}`);
    }

    return 40;
  }, [hasKillerCage, cageInfo.paths]);

  return {
    overlayRef,
    cageInfo,
    cellSize,
  };
};
