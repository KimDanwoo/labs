export const itemAt = <T>(items: readonly T[], index: number): T => {
  const item = items[index];
  if (item === undefined) throw new RangeError(`index ${index} is out of range (length ${items.length})`);
  return item;
};
