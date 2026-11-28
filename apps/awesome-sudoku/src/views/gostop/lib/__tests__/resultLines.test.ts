import { SIDE } from '@views/gostop/config/game';
import { bakLines, recordLine, scoreLines } from '@views/gostop/lib/resultLines';
import { scoreOf } from '@views/gostop/lib/score';
import type { GameResult } from '@views/gostop/model/types/gostop';
import { describe, expect, it } from 'vitest';

const HONG_AND_GODORI = [1, 5, 9, 4, 12, 29];
const PI_ELEVEN = [2, 3, 6, 7, 10, 11, 14, 15, 18, 19, 22];

describe('점수 낸 내역', () => {
  it('scoreOf 결과에서 점수가 난 갈래만 고르고 합이 총점과 같다', () => {
    const captured = [...HONG_AND_GODORI, ...PI_ELEVEN];
    const score = scoreOf(captured);
    const lines = scoreLines(score, captured);
    expect(lines.map((line) => line.label)).toEqual(['고도리', '홍단', '피']);
    expect(lines.reduce((sum, line) => sum + line.points, 0)).toBe(score.total);
  });

  it('점수가 없으면 내역도 없다', () => {
    expect(scoreLines(scoreOf([0]), [0])).toEqual([]);
  });
});

describe('박 이유', () => {
  const result: GameResult = { winner: SIDE.ME, base: 9, goCount: 0, baks: ['piBak', 'goBak'], points: 36 };
  const captured = { [SIDE.ME]: PI_ELEVEN, [SIDE.COMPUTER]: [23, 26, 27, 47] };

  it('박마다 진 쪽의 패 수로 이유를 붙인다', () => {
    const lines = bakLines(result, captured, { [SIDE.ME]: 0, [SIDE.COMPUTER]: 1 });
    expect(lines).toEqual([
      { bak: 'piBak', reason: '컴퓨터 피 5장' },
      { bak: 'goBak', reason: '컴퓨터가 1고 하고 짐' },
    ]);
  });

  it('내가 지면 내 패로 이유를 적는다', () => {
    const lost: GameResult = { ...result, winner: SIDE.COMPUTER, baks: ['gwangBak'] };
    const lines = bakLines(lost, { [SIDE.ME]: [2], [SIDE.COMPUTER]: [0, 8, 28] }, { [SIDE.ME]: 0, [SIDE.COMPUTER]: 0 });
    expect(lines).toEqual([{ bak: 'gwangBak', reason: '내 광 0장' }]);
  });

  it('나가리에는 박이 없다', () => {
    expect(bakLines({ ...result, winner: null }, captured, { [SIDE.ME]: 0, [SIDE.COMPUTER]: 0 })).toEqual([]);
  });
});

describe('전적 한 줄', () => {
  it('판·승·패·나가리, 연승, 최고 점수를 한 줄로 잇는다', () => {
    const record = { played: 12, wins: 7, losses: 4, draws: 1, streak: 2, bestPoints: 34, lastGameId: null };
    expect(recordLine(record)).toBe('12판 7승 4패 1나가리 · 연승 2 · 최고 점수 34점');
  });
});
