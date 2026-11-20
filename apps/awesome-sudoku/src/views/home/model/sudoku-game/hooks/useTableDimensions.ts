import { measureTable } from '@views/home/lib/tableLayout';
import type { TableDimensions } from '@views/home/model/types/board';
import { useEffect, useRef, type RefObject } from 'react';

export function useTableDimensions(
  tableRef: RefObject<HTMLTableElement | null>,
  onDimensionsChange: (dimensions: TableDimensions) => void,
) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const onDimensionsChangeRef = useRef(onDimensionsChange);
  useEffect(() => {
    onDimensionsChangeRef.current = onDimensionsChange;
  }, [onDimensionsChange]);

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return undefined;
    let frame: number | null = null;

    const measure = () => {
      frame = null;
      const dimensions = measureTable(table);
      const overlay = overlayRef.current;
      if (overlay && dimensions.tableRect) {
        overlay.style.width = `${dimensions.tableRect.width}px`;
        overlay.style.height = `${dimensions.tableRect.height}px`;
      }
      onDimensionsChangeRef.current(dimensions);
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
