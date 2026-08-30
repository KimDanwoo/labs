/**
 * 비어 있지 않은 배열에서 무작위 원소를 고른다.
 * 인덱스가 항상 범위 안이라는 사실을 타입으로는 표현할 수 없어 여기 한 곳에서만 단언한다.
 */
export function pickRandom<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)] as T;
}
