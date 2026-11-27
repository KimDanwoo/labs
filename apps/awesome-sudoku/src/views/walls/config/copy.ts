import { OUTCOME, STEP } from '@views/walls/config/game';
import type { Outcome, Step } from '@views/walls/model/types/walls';

export const WALLS_COPY = {
  boardLabel: '담쌓기 판',
  undo: '무르기',
  newGame: '새 게임',
  playAgain: '다시 하기',
  ruleTitle: '담쌓기 규칙',
  ruleCaption: '말을 옮기고 담을 세워 땅을 나눠요',
  scoreLabel: '예상 땅',
  scoreMe: '나',
  scoreComputer: '컴퓨터',
  scoreHint: '내 말이 더 가까운 칸을 내 땅으로 세요.',
  wallOption: '여기에 담 세우기',
} as const;

export const STEP_TEXT: Record<Step, string> = {
  [STEP.THINKING]: '컴퓨터가 생각하는 중…',
  [STEP.PICK_PAWN]: '움직일 내 말을 고르세요',
  [STEP.PICK_CELL]: '옮길 칸을 고르세요',
  [STEP.PICK_WALL]: '담을 세울 변을 고르세요',
};

export const STEP_NOTE: Partial<Record<Step, string>> = {
  [STEP.PICK_CELL]: '말을 다시 누르면 제자리',
};

export const OUTCOME_TITLE: Record<Outcome, string> = {
  [OUTCOME.PLAYING]: '',
  [OUTCOME.WON]: '이겼어요! 땅을 더 넓게 차지했어요',
  [OUTCOME.LOST]: '졌어요. 한 판 더 해볼까요?',
  [OUTCOME.DRAW]: '비겼어요',
};

export const WALLS_RULES = [
  '내 차례에 말 하나를 골라 가로·세로로 최대 2칸 옮겨요. 중간에 꺾어도 되고, 담과 다른 말은 넘지 못해요. 제자리에 있어도 돼요.',
  '옮긴 말이 선 칸의 네 변 중 한 곳에 담을 세워요.',
  '내 말과 컴퓨터 말이 담으로 완전히 갈라지면 끝나요. 내 말만 있는 구역의 칸 수가 내 땅이에요.',
] as const;
