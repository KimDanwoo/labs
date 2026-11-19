import { useEffect, useRef } from 'react';

export const useFocusWhenSelected = (isSelected: boolean) => {
  const cellRef = useRef<HTMLTableCellElement | null>(null);

  useEffect(() => {
    const cell = cellRef.current;
    if (!isSelected || !cell) return;
    const active = document.activeElement;
    const isFocusInBoard =
      active instanceof HTMLElement && active.closest('[role="grid"]') === cell.closest('[role="grid"]');
    if (isFocusInBoard && active !== cell) cell.focus();
  }, [isSelected]);

  return cellRef;
};
