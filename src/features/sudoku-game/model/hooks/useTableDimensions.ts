import { BOARD_SIZE, SUDOKU_CELL_COUNT } from "@entities/board/model/constants";
import { useCallback, useEffect, useRef, useState } from "react";

export interface CellPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TableDimensions {
  tableRect: DOMRect | null;
  cellPositions: Record<string, CellPosition>;
}

const DEBOUNCE_DELAY = 16; // ~1 frame at 60fps for smooth resize

export const useTableDimensions = (
  onDimensionsChange: (dimensions: TableDimensions) => void,
  deps: unknown[],
) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const [isReady, setIsReady] = useState(false);

  const onDimensionsChangeRef = useRef(onDimensionsChange);
  onDimensionsChangeRef.current = onDimensionsChange;

  const depsKey = JSON.stringify(deps);

  const calculateDimensions = useCallback(() => {
    const table = document.querySelector("table.border-collapse");
    if (!table) {
      onDimensionsChangeRef.current({ tableRect: null, cellPositions: {} });
      return;
    }

    const cells = table.querySelectorAll("td");
    if (cells.length !== SUDOKU_CELL_COUNT) {
      onDimensionsChangeRef.current({ tableRect: null, cellPositions: {} });
      return;
    }

    const tableRect = table.getBoundingClientRect();
    const cellPositions: Record<string, CellPosition> = {};

    Array.from(cells).forEach((cell, index) => {
      const row = Math.floor(index / BOARD_SIZE);
      const col = index % BOARD_SIZE;
      const rect = cell.getBoundingClientRect();

      cellPositions[`${row}-${col}`] = {
        x: rect.left - tableRect.left,
        y: rect.top - tableRect.top,
        width: rect.width,
        height: rect.height,
      };
    });

    if (overlayRef.current) {
      overlayRef.current.style.width = `${tableRect.width}px`;
      overlayRef.current.style.height = `${tableRect.height}px`;
    }

    onDimensionsChangeRef.current({ tableRect, cellPositions });
    setIsReady(true);
  }, []);

  const scheduleCalculation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      calculateDimensions();
    });
  }, [calculateDimensions]);

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect();
      mutationObserverRef.current = null;
    }
  }, []);

  useEffect(() => {
    calculateDimensions();

    const setupObservers = () => {
      const table = document.querySelector("table.border-collapse");
      if (!table) return;

      // ResizeObserver for responsive resize
      if (!resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
          scheduleCalculation();
        });
        resizeObserverRef.current.observe(table);
      }

      // MutationObserver for DOM changes
      if (!mutationObserverRef.current) {
        mutationObserverRef.current = new MutationObserver((mutations) => {
          const hasRelevantChanges = mutations.some(
            (mutation) =>
              mutation.type === "childList" ||
              (mutation.type === "attributes" && ["class", "style"].includes(mutation.attributeName || "")),
          );

          if (hasRelevantChanges) {
            scheduleCalculation();
          }
        });

        mutationObserverRef.current.observe(table, {
          attributes: true,
          attributeFilter: ["class", "style"],
          childList: true,
          subtree: true,
        });
      }
    };

    const observerTimer = setTimeout(setupObservers, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(observerTimer);
      cleanup();
    };
  }, [depsKey, cleanup, calculateDimensions, scheduleCalculation]);

  useEffect(() => cleanup, [cleanup]);

  return {
    overlayRef,
    isReady,
  };
};
