export function shuffleArray<T>(arr: T[]): T[] {
  return arr
    .map((item) => ({ item, order: Math.random() }))
    .sort((left, right) => left.order - right.order)
    .map(({ item }) => item);
}
