import type { DiscardAction } from '@entities/sudoku/model/types/game';

export const GAME_CONFIRM_COPY = {
  newGame: {
    title: '새 게임을 시작할까요?',
    message: '진행 중인 게임은 저장되지 않고 사라져요.',
    confirm: '새 게임',
  },
  restart: {
    title: '처음부터 다시 할까요?',
    message: '입력한 숫자와 메모, 시간·오답·힌트가 처음으로 돌아가요. 되돌리기로 되살릴 수 없어요.',
    confirm: '다시 하기',
  },
} as const satisfies Record<DiscardAction['kind'], { title: string; message: string; confirm: string }>;
