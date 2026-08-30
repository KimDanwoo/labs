/** Fisher-Yates 셔플. 원본 배열을 변경하지 않는다. */
export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // i는 length-1..1, j는 0..i라 두 인덱스 모두 항상 범위 안이다.
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}
