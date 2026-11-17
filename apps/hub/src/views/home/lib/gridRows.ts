const WIDE_ROW = 2;
const NARROW_ROW = 3;

export type RowSize = 1 | typeof WIDE_ROW | typeof NARROW_ROW;

function repeatRow(rowSize: RowSize, rowCount: number): RowSize[] {
  return Array.from({ length: rowCount }, () => rowSize);
}

export function planRowSizes(cardCount: number): RowSize[] {
  if (cardCount <= 0) return [];
  if (cardCount === 1) return [1];
  if (cardCount % NARROW_ROW === 0) return repeatRow(NARROW_ROW, cardCount / NARROW_ROW);
  if (cardCount % WIDE_ROW === 0) return repeatRow(WIDE_ROW, cardCount / WIDE_ROW);

  const wideRowCount = cardCount % NARROW_ROW === WIDE_ROW ? 1 : 2;
  const narrowRowCount = (cardCount - wideRowCount * WIDE_ROW) / NARROW_ROW;
  return [...repeatRow(WIDE_ROW, wideRowCount), ...repeatRow(NARROW_ROW, narrowRowCount)];
}

export function planCardRowSizes(cardCount: number): RowSize[] {
  return planRowSizes(cardCount).flatMap((rowSize) => repeatRow(rowSize, rowSize));
}
