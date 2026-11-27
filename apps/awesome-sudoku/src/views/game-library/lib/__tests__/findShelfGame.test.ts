import { describe, expect, it } from 'vitest';

import type { GameId } from '@entities/game-catalog';
import { findShelfGame } from '@views/game-library/lib/findShelfGame';

const SLIDE_IDS: GameId[] = ['gomoku', 'sudoku', 'slitherlink', 'guess', 'killer', 'walls'];

describe('findShelfGame', () => {
  it('체험판 슬라이드마다 같은 id의 본게임 주소를 찾는다', () => {
    expect(SLIDE_IDS.map((id) => findShelfGame(id).href)).toEqual([
      '/gomoku',
      '/sudoku',
      '/slitherlink',
      '/guess',
      '/killer',
      '/walls',
    ]);
  });

  it('게임 목록에 보이는 이름을 그대로 쓴다', () => {
    expect(findShelfGame('guess').name).toBe('오늘의 맞춰봐');
    expect(findShelfGame('gomoku').name).toBe('오목');
  });
});
