import { SUDOKU_CELL_COUNT } from "@entities/board/model/constants";
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

export const useTableDimensions = (
  onDimensionsChange: (dimensions: TableDimensions) => void,
  deps: unknown[],
) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const observerRef = useRef<MutationObserver | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Use ref to store callback to prevent infinite loops
  const onDimensionsChangeRef = useRef(onDimensionsChange);
  onDimensionsChangeRef.current = onDimensionsChange;

  // Stable dependency key
  const depsKey = JSON.stringify(deps);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const clearObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    clearTimers();
    clearObserver();
  }, [clearTimers, clearObserver]);

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

    if (overlayRef.current) {
      overlayRef.current.style.width = `${tableRect.width}px`;
      overlayRef.current.style.height = `${tableRect.height}px`;
    }

    onDimensionsChangeRef.current({ tableRect, cellPositions });
    setIsReady(true);
  }, []);

  const debouncedCalculate = useCallback(() => {
    clearTimers();
    const delays = [50, 150, 300];
    timersRef.current = delays.map((delay) => setTimeout(calculateDimensions, delay));
  }, [calculateDimensions, clearTimers]);

  useEffect(() => {
    calculateDimensions();

    const setupObserver = () => {
      const table = document.querySelector("table.border-collapse");
      if (table && !observerRef.current) {
        observerRef.current = new MutationObserver((mutations) => {
          const hasRelevantChanges = mutations.some(
            (mutation) =>
              mutation.type === "childList" ||
              (mutation.type === "attributes" && ["class", "style"].includes(mutation.attributeName || "")),
          );

          if (hasRelevantChanges) {
            debouncedCalculate();
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

    const observerTimer = setTimeout(setupObserver, 100);

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(debouncedCalculate, 50);
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      clearTimeout(observerTimer);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      cleanup();
    };
  }, [depsKey, cleanup, calculateDimensions, debouncedCalculate]);

  useEffect(() => cleanup, [cleanup]);

  return {
    overlayRef,
    isReady,
  };
};
