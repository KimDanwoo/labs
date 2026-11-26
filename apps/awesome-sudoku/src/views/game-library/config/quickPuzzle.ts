import {
  CLASSIC_PUZZLES,
  KILLER_PUZZLES,
  type QuickSudokuFixture,
} from '@views/game-library/config/quickSudokuFixtures';

const BOARD_SIZE = 6;
const BLANK = '0';

export type QuickSudokuMode = 'classic' | 'killer';

export interface QuickCage {
  name: string;
  total: number;
  showsTotal: boolean;
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

interface QuickCell {
  id: string;
  row: number;
  column: number;
  value: number;
  isBlank: boolean;
  cage: QuickCage | undefined;
}

export type QuickRows = { id: number; cells: QuickCell[] }[];

export const QUICK_NUMBERS = Array.from({ length: BOARD_SIZE }, (_, index) => index + 1);

function cageAt(fixture: QuickSudokuFixture, cell: number): QuickCage | undefined {
  const { cages, solution } = fixture;
  const group = cages?.[cell];
  const hasCage = group && cages;
  if (!hasCage) return undefined;
  const total = Array.from(cages).reduce(
    (sum, name, index) => (name === group ? sum + Number(solution[index]) : sum),
    0,
  );
  const boardColumn = cell % BOARD_SIZE;
  return {
    name: group,
    total,
    showsTotal: cages.indexOf(group) === cell,
    top: cages[cell - BOARD_SIZE] !== group,
    right: boardColumn === BOARD_SIZE - 1 || cages[cell + 1] !== group,
    bottom: cages[cell + BOARD_SIZE] !== group,
    left: boardColumn === 0 || cages[cell - 1] !== group,
  };
}

function createQuickBoard(fixture: QuickSudokuFixture): QuickRows {
  const { givens, solution } = fixture;
  return QUICK_NUMBERS.map((row) => ({
    id: row,
    cells: QUICK_NUMBERS.map((column) => {
      const index = (row - 1) * BOARD_SIZE + column - 1;
      return {
        id: `${row}-${column}`,
        row,
        column,
        value: Number(solution[index]),
        isBlank: givens[index] === BLANK,
        cage: cageAt(fixture, index),
      };
    }),
  }));
}

export const QUICK_SUDOKU_BOARDS = {
  classic: { initial: createQuickBoard(CLASSIC_PUZZLES[0]), boards: CLASSIC_PUZZLES.map(createQuickBoard) },
  killer: { initial: createQuickBoard(KILLER_PUZZLES[0]), boards: KILLER_PUZZLES.map(createQuickBoard) },
} satisfies Record<QuickSudokuMode, { initial: QuickRows; boards: QuickRows[] }>;

type CheckResult = 'playing' | 'incomplete' | 'incorrect' | 'solved';
export type QuickEntries = Readonly<Record<string, number>>;

export interface QuickSudokuState {
  boardIndex: number;
  entries: QuickEntries;
  active: string | undefined;
  result: CheckResult;
}

export const CHECK_MESSAGES: Record<CheckResult, string> = {
  playing: '칸을 고르고 숫자를 넣으세요.',
  incomplete: '아직 빈칸이 남았어요.',
  incorrect: '틀린 칸이 있어요. 가로줄, 세로줄과 구역을 다시 확인해 보세요.',
  solved: '스도쿠를 완성했어요.',
};

export const INITIAL_SUDOKU_STATE: QuickSudokuState = {
  boardIndex: 0,
  entries: {},
  active: undefined,
  result: 'playing',
};
