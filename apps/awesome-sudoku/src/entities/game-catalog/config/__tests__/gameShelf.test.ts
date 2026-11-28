import { describe, expect, it } from 'vitest';

import { GAME_LIST } from '@entities/game-catalog/config/games';
import { GAME_SHELF } from '@entities/game-catalog/config/gameShelf';

describe('GAME_SHELF', () => {
  it('오늘의 맞춰봐를 맨 앞에 두고 나머지는 카탈로그 순서를 따른다', () => {
    expect(GAME_SHELF.map(({ id }) => id)).toEqual([
      'guess',
      ...GAME_LIST.map(([id]) => id).filter((id) => id !== 'guess'),
    ]);
  });

  it('맞춰봐만 진열용 이름으로 바꾸고 나머지는 카탈로그 이름을 쓴다', () => {
    const names = Object.fromEntries(GAME_SHELF.map(({ id, name }) => [id, name]));
    expect(names.guess).toBe('오늘의 맞춰봐');
    expect(names.lotto).toBe('로또 시뮬레이터');
    expect(names.gostop).toBe('맞고');
  });
});
