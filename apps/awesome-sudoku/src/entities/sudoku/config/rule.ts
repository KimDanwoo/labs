import { GAME_MODE, HINTS_REMAINING, MAX_MISTAKES } from '@entities/sudoku/config/game';
import type { GameMode } from '@entities/sudoku/model/types/game';

interface SudokuRuleCopy {
  title: string;
  caption: string;
  items: readonly string[];
}

const PLAY_RULES = [
  `오답이 ${MAX_MISTAKES}번 쌓이면 게임이 끝나요. 힌트는 한 판에 ${HINTS_REMAINING}번, 칸 하나를 채워 줘요.`,
  '메모를 켜면 칸에 후보 숫자를 작게 적어 둘 수 있어요.',
] as const;

export const SUDOKU_RULE: Record<GameMode, SudokuRuleCopy> = {
  [GAME_MODE.CLASSIC]: {
    title: '스도쿠 규칙',
    caption: '가로·세로·3×3 칸에 1~9를 한 번씩',
    items: [
      '빈칸에 1부터 9까지 채워요. 가로줄·세로줄·굵은 선 3×3 칸 안에서 같은 숫자가 겹치면 안 돼요.',
      ...PLAY_RULES,
    ],
  },
  [GAME_MODE.KILLER]: {
    title: '킬러 스도쿠 규칙',
    caption: '점선 칸의 합을 맞춰요',
    items: [
      '클래식 스도쿠처럼 가로·세로·3×3 칸에 1부터 9까지 한 번씩 넣어요.',
      '점선으로 묶인 칸의 숫자를 더하면 모서리의 작은 숫자가 되고, 그 안에서는 같은 숫자를 다시 쓸 수 없어요.',
      ...PLAY_RULES,
    ],
  },
};
