export const CAPACITY = 96;

export const CELL = 24;

export const hash = (n: number) => {
  const value = Math.sin(n * 127.1) * 43758.5453;
  return value - Math.floor(value);
};
