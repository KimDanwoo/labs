import { STONE } from '@views/gomoku/config/board';
import { OUTCOME } from '@views/gomoku/config/game';
import type { Outcome } from '@views/gomoku/model/types/gomoku';

export const GOMOKU_COPY = {
  title: '오목',
  boardLabel: '오목판',
  colorSelect: '내 돌 선택',
  colorHint: '돌을 바꾸면 새 게임이 시작돼요.',
  thinking: '컴퓨터가 생각하는 중…',
  undo: '무르기',
  newGame: '새 게임',
  playAgain: '다시 하기',
  rule: '렌주룰: 흑은 삼삼·사사·장목(6목 이상)을 둘 수 없고, 정확히 5목을 완성하면 금수보다 승리가 우선해요. 백은 금수 없이 5목 이상이면 이겨요.',
} as const;

export const MY_TURN = {
  [STONE.BLACK]: '내 차례예요 (흑 · 선공)',
  [STONE.WHITE]: '내 차례예요 (백 · 후공)',
} as const;

export const STONE_OPTIONS = [
  { stone: STONE.BLACK, label: '흑 · 선공' },
  { stone: STONE.WHITE, label: '백 · 후공' },
] as const;

export const OUTCOME_TITLE: Record<Outcome, string> = {
  [OUTCOME.PLAYING]: '',
  [OUTCOME.WON]: '이겼어요! 고수를 꺾었네요',
  [OUTCOME.LOST]: '졌어요. 한 판 더 해볼까요?',
  [OUTCOME.DRAW]: '비겼어요',
};
