import { describe, expect, it } from 'vitest';

import { STONE } from '@views/gomoku/config/board';
import { GOMOKU_COPY, OUTCOME_TITLE, STONE_NOTE } from '@views/gomoku/config/copy';
import { OUTCOME } from '@views/gomoku/config/game';
import { statusViewOf } from '@views/gomoku/lib/status';

describe('statusViewOf', () => {
  it('내 차례면 내 돌과 선후공 설명을 보여 준다', () => {
    expect(statusViewOf(OUTCOME.PLAYING, false, STONE.WHITE)).toEqual({
      text: GOMOKU_COPY.myTurn,
      note: STONE_NOTE[STONE.WHITE],
      stone: STONE.WHITE,
    });
  });

  it('컴퓨터가 생각하는 중이면 상대 돌을 보여 준다', () => {
    expect(statusViewOf(OUTCOME.PLAYING, true, STONE.BLACK)).toEqual({
      text: GOMOKU_COPY.thinking,
      note: null,
      stone: STONE.WHITE,
    });
  });

  it('승부가 나면 결과 문구만 보여 준다', () => {
    expect(statusViewOf(OUTCOME.LOST, false, STONE.BLACK)).toEqual({
      text: OUTCOME_TITLE[OUTCOME.LOST],
      note: null,
      stone: null,
    });
  });
});
