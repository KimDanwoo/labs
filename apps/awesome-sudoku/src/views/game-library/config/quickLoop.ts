const SIZE = 7;
const CLUES_PER_ROW = 3;

type LoopSlot = { id: number; label: string } & (
  | { kind: 'dot' }
  | { kind: 'clue'; clue: number }
  | { kind: 'edge'; isHorizontal: boolean }
);

export const LOOP_SLOTS: LoopSlot[] = Array.from({ length: SIZE ** 2 }, (_, index) => {
  const row = Math.floor(index / SIZE);
  const column = index % SIZE;
  const isHorizontal = row % 2 === 0;
  const isEvenColumn = column % 2 === 0;
  const label = `${row + 1}행 ${column + 1}열`;
  if (isHorizontal !== isEvenColumn) return { id: index, label, kind: 'edge', isHorizontal };
  if (isHorizontal) return { id: index, label, kind: 'dot' };
  return { id: index, label, kind: 'clue', clue: Math.floor(row / 2) * CLUES_PER_ROW + Math.floor(column / 2) };
});

interface LoopPosition {
  clues: number[];
  start: number[];
  solution: number[];
}

export const LOOP_BOARDS: [LoopPosition, ...LoopPosition[]] = [
  { clues: [2, 2, 3, 3, 1, 2, 2, 3, 1], start: [19, 29], solution: [3, 5, 9, 13, 15, 19, 21, 25, 29, 37, 39, 45] },
  {
    clues: [3, 1, 2, 3, 1, 1, 3, 1, 2],
    start: [27, 47],
    solution: [1, 3, 5, 7, 13, 15, 23, 27, 29, 35, 41, 43, 45, 47],
  },
  {
    clues: [2, 2, 3, 2, 1, 3, 2, 1, 3],
    start: [3, 15],
    solution: [3, 5, 9, 13, 15, 19, 21, 25, 33, 35, 41, 43, 45, 47],
  },
];
