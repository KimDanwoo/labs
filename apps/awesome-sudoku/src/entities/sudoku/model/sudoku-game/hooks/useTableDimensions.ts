import { measureTable, sizeOverlayToTable } from '@entities/sudoku/lib/tableLayout';
import type { TableDimensions } from '@entities/sudoku/model/types/board';
import { useEffect, useEffectEvent, useRef, type RefObject } from 'react';

export function useTableDimensions(
  tableRef: RefObject<HTMLTableElement | null>,
  onDimensionsChange: (dimensions: TableDimensions) => void,
) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const notifyDimensions = useEffectEvent(onDimensionsChange);

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return undefined;
    let frame: number | null = null;

    const measure = () => {
      frame = null;
      const dimensions = measureTable(table);
      sizeOverlayToTable(overlayRef.current, dimensions.tableRect);
      notifyDimensions(dimensions);
    };
    const scheduleMeasure = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(table);
    scheduleMeasure();
    return () => {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [tableRef]);

  return { overlayRef };
}
