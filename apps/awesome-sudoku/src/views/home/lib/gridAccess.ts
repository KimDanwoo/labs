/** 고정 크기 보드에서도 외부 입력의 잘못된 좌표를 조용히 통과시키지 않는다. */
export function atIndex<T>(values: readonly T[], index: number): T {
  if (!Number.isInteger(index) || index < 0 || index >= values.length) {
    throw new RangeError(`범위를 벗어난 인덱스입니다: ${index}`);
  }
  const value = values[index];
  if (value === undefined) throw new RangeError(`비어 있는 인덱스입니다: ${index}`);
  return value;
}

export function cellAt<T>(grid: readonly (readonly T[])[], row: number, col: number): T {
  return atIndex(atIndex(grid, row), col);
}
