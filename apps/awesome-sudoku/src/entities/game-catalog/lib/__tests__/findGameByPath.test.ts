import { describe, expect, it } from 'vitest';

import { findGameByPath } from '@entities/game-catalog/lib/findGameByPath';

describe('findGameByPath', () => {
  it('게임 경로와 정확히 같으면 그 게임을 찾는다', () => {
    expect(findGameByPath('/lotto')?.id).toBe('lotto');
  });

  it('하위 경로와 끝 슬래시도 같은 게임으로 본다', () => {
    expect(findGameByPath('/sudoku/daily')?.id).toBe('sudoku');
    expect(findGameByPath('/sudoku/')?.id).toBe('sudoku');
  });

  it('이름 앞부분만 겹치는 경로는 다른 게임으로 보지 않는다', () => {
    expect(findGameByPath('/sudoku-x')).toBeUndefined();
  });

  it('홈과 카탈로그에 없는 경로에서는 게임이 없다', () => {
    expect(findGameByPath('/')).toBeUndefined();
    expect(findGameByPath('/unknown')).toBeUndefined();
  });

  it('찾은 게임은 진열용 이름을 쓴다', () => {
    expect(findGameByPath('/guess')?.name).toBe('오늘의 맞춰봐');
  });
});
