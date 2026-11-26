const ROW_LENGTH = 7;

export const QUICK_GOMOKU_CELLS = Array.from({ length: ROW_LENGTH ** 2 }, (_, index) => ({
  id: index,
  row: Math.floor(index / ROW_LENGTH) + 1,
  column: (index % ROW_LENGTH) + 1,
}));

interface GomokuPosition {
  black: number[];
  white: number[];
  setup: number;
  defense: number;
  winning: number;
}

type Turn = 'opening' | 'finish' | 'solved';
export interface GomokuProgress {
  position: number;
  turn: Turn;
  hasMistake: boolean;
}

export const INITIAL_GOMOKU: GomokuProgress = { position: 0, turn: 'opening', hasMistake: false };

export const TURN_TEXT: Record<Turn, string> = {
  opening: '흑의 첫 수를 두세요.',
  finish: '백이 한쪽을 막았어요. 흑의 두 번째 수를 두세요.',
  solved: '두 수로 다섯 알을 이었어요.',
};

export const QUICK_GOMOKU_BOARDS: [GomokuPosition, ...GomokuPosition[]] = [
  {
    black: [6, 11, 16, 23, 25, 26, 38, 41],
    white: [15, 17, 18, 29, 36, 37, 46, 47],
    setup: 24,
    defense: 22,
    winning: 27,
  },
  {
    black: [10, 12, 14, 16, 32, 33, 40, 44],
    white: [9, 17, 21, 22, 25, 34, 36, 37],
    setup: 24,
    defense: 8,
    winning: 48,
  },
  { black: [3, 5, 8, 13, 16, 30, 37, 41], white: [1, 4, 7, 12, 35, 38, 42, 47], setup: 23, defense: 9, winning: 44 },
];
