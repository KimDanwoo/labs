import { OUTCOME } from '@views/gomoku/config/game';
import type { Outcome } from '@views/gomoku/model/types/gomoku';

export const GOMOKU_COPY = {
  title: '오목',
  boardLabel: '오목판',
  myTurn: '내 차례예요 (흑)',
  thinking: '컴퓨터가 생각하는 중…',
  undo: '무르기',
  newGame: '새 게임',
  playAgain: '다시 하기',
  rule: '가로·세로·대각선으로 다섯 알을 먼저 이으면 이겨요. 삼삼(열린 3 두 개를 한 번에 만드는 수)은 둘 수 없어요.',
} as const;

export const OUTCOME_TITLE: Record<Outcome, string> = {
  [OUTCOME.PLAYING]: '',
  [OUTCOME.WON]: '이겼어요! 고수를 꺾었네요',
  [OUTCOME.LOST]: '졌어요. 한 판 더 해볼까요?',
  [OUTCOME.DRAW]: '비겼어요',
};
