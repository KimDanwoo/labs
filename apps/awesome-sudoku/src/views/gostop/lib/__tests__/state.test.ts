import { SIDE } from '@views/gostop/config/game';
import { countUpValue } from '@views/gostop/lib/countUp';
import { goBonusOf } from '@views/gostop/lib/goBonus';
import { EMPTY_RECORD, parseRecord, recordGame } from '@views/gostop/lib/record';
import { bakRisks } from '@views/gostop/lib/risk';
import { goPoints } from '@views/gostop/lib/score';
import { DEFAULT_SETTINGS, parseSettings } from '@views/gostop/lib/settings';
import { parseStoredText } from '@views/gostop/lib/storage';
import type { GameResult } from '@views/gostop/model/types/gostop';
import { describe, expect, it } from 'vitest';

const GWANG = { jan: 0, mar: 8, aug: 28 } as const;
const PI = [2, 3, 6, 7, 10, 11, 14, 15, 18, 19, 22, 23] as const;
const SSANG_PI = 41;

describe('박 위험', () => {
  it('상대가 피 점수를 냈고 내 피가 7장 이하면 피박 위험이다', () => {
    const rival = [...PI.slice(0, 10)];
    expect(bakRisks(PI.slice(10, 12), rival)).toEqual(['piBak']);
    expect(bakRisks([...PI.slice(10, 12), SSANG_PI, 26, 27, 30, 31], rival)).toEqual([]);
  });

  it('쌍피는 피 2장으로 센다', () => {
    const rival = [...PI.slice(0, 10)];
    expect(bakRisks([SSANG_PI, 26, 27, 30, 31, 34, 35], rival)).toEqual([]);
    expect(bakRisks([SSANG_PI, 26, 27, 30, 31, 34], rival)).toEqual(['piBak']);
  });

  it('상대가 광 점수를 냈고 내 광이 0장이면 광박 위험이다', () => {
    const rival = [GWANG.jan, GWANG.mar, GWANG.aug];
    expect(bakRisks([], rival)).toEqual(['gwangBak']);
    expect(bakRisks([44], rival)).toEqual([]);
  });

  it('상대 점수가 없으면 위험도 없다', () => {
    expect(bakRisks([], [GWANG.jan, GWANG.mar, ...PI.slice(0, 9)])).toEqual([]);
  });
});

describe('고 보너스', () => {
  it('지금 스톱하면 붙는 보너스와 배수가 goPoints와 맞는다', () => {
    [0, 1, 2, 3, 4, 5].forEach((goCount) => {
      const { add, times } = goBonusOf(goCount);
      expect((7 + add) * times).toBe(goPoints(7, goCount));
    });
    expect(goBonusOf(0)).toEqual({ add: 0, times: 1 });
    expect(goBonusOf(4)).toEqual({ add: 2, times: 4 });
  });
});

const win = (points: number): GameResult => ({ winner: SIDE.ME, base: points, goCount: 0, baks: [], points });
const lose: GameResult = { winner: SIDE.COMPUTER, base: 7, goCount: 0, baks: [], points: 7 };
const draw: GameResult = { winner: null, base: 0, goCount: 0, baks: [], points: 0 };

describe('전적', () => {
  it('판 결과를 세고 연승과 최고 점수를 갱신한다', () => {
    const first = recordGame(EMPTY_RECORD, 'a', win(9));
    const second = recordGame(first, 'b', win(14));
    const third = recordGame(second, 'c', draw);
    const fourth = recordGame(third, 'd', lose);
    expect(second).toMatchObject({ played: 2, wins: 2, streak: 2, bestPoints: 14 });
    expect(third).toMatchObject({ played: 3, draws: 1, streak: 2 });
    expect(fourth).toMatchObject({ played: 4, losses: 1, streak: 0, bestPoints: 14, lastGameId: 'd' });
  });

  it('같은 판은 두 번 기록하지 않는다', () => {
    const once = recordGame(EMPTY_RECORD, 'same', win(9));
    expect(recordGame(once, 'same', win(9))).toBe(once);
  });

  it('저장값 형태를 검증하고 깨진 값이면 0부터 시작한다', () => {
    const valid = { played: 3, wins: 2, losses: 1, draws: 0, streak: 1, bestPoints: 12, lastGameId: 'x' };
    expect(parseRecord(valid)).toEqual(valid);
    expect(parseRecord({ ...valid, lastGameId: undefined })).toEqual({ ...valid, lastGameId: null });
    expect(parseRecord({ ...valid, wins: -1 })).toEqual(EMPTY_RECORD);
    expect(parseRecord({ ...valid, played: 1.5 })).toEqual(EMPTY_RECORD);
    expect(parseRecord({ ...valid, streak: '2' })).toEqual(EMPTY_RECORD);
    expect(parseRecord({ ...valid, lastGameId: 7 })).toEqual(EMPTY_RECORD);
    expect(parseRecord([1, 2])).toEqual(EMPTY_RECORD);
    expect(parseRecord(null)).toEqual(EMPTY_RECORD);
  });
});

describe('설정', () => {
  it('속도와 음소거를 검증하고 모르는 값은 기본값으로 둔다', () => {
    expect(parseSettings({ speed: 'fast', isMuted: true })).toEqual({ speed: 'fast', isMuted: true });
    expect(parseSettings({ speed: 'turbo', isMuted: 'yes' })).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('fast')).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS).toEqual({ speed: 'normal', isMuted: false });
  });

  it('JSON이 깨졌으면 null로 읽는다', () => {
    expect(parseStoredText('{broken')).toBeNull();
    expect(parseStoredText(null)).toBeNull();
    expect(parseStoredText('{"speed":"fast"}')).toEqual({ speed: 'fast' });
  });
});

describe('점수 세기', () => {
  it('0에서 시작해 정해진 시간에 최종 값에 닿는다', () => {
    expect(countUpValue(18, 0, 900)).toBe(0);
    expect(countUpValue(18, 450, 900)).toBeGreaterThan(9);
    expect(countUpValue(18, 900, 900)).toBe(18);
    expect(countUpValue(18, 2000, 900)).toBe(18);
  });
});
