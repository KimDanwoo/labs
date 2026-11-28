import { CARD_KIND } from '@views/gostop/config/cards';
import { PHASE, SIDE } from '@views/gostop/config/game';
import {
  capturedByKind,
  cardImageSrc,
  cardLabel,
  gameStatus,
  goChipOf,
  goPreview,
  kindCount,
  outcomeOf,
} from '@views/gostop/lib/view';
import { describe, expect, it } from 'vitest';

describe('카드 표시', () => {
  it('달과 종류로 이름을 짓는다', () => {
    expect(cardLabel(0)).toBe('1월 광');
    expect(cardLabel(4)).toBe('2월 고도리 열끗');
    expect(cardLabel(1)).toBe('1월 홍단 띠');
    expect(cardLabel(44)).toBe('12월 비광');
    expect(cardLabel(47)).toBe('12월 쌍피');
  });

  it('달 번호로 그림 경로를 만든다', () => {
    expect(cardImageSrc(0)).toBe('/hwatu/month-01.webp');
    expect(cardImageSrc(47)).toBe('/hwatu/month-12.webp');
  });
});

describe('바닥과 먹은 패 묶기', () => {
  it('먹은 패를 종류별로 묶고 쌍피는 2장으로 센다', () => {
    const groups = capturedByKind([0, 2, 47]);
    expect(groups[CARD_KIND.GWANG]).toEqual([0]);
    expect(kindCount(CARD_KIND.PI, groups[CARD_KIND.PI])).toBe(3);
  });
});

describe('진행 상태', () => {
  it('차례와 단계로 상태 알약 갈래를 고른다', () => {
    expect(gameStatus(PHASE.READY, SIDE.ME)).toBe('ready');
    expect(gameStatus(PHASE.PLAY, SIDE.ME)).toBe('myTurn');
    expect(gameStatus(PHASE.DECIDE, SIDE.ME)).toBe('deciding');
    expect(gameStatus(PHASE.DECIDE, SIDE.COMPUTER)).toBe('rivalTurn');
    expect(gameStatus(PHASE.OVER, SIDE.COMPUTER)).toBe('over');
  });

  it('승자가 없으면 나가리다', () => {
    expect(outcomeOf(null)).toBe('draw');
    expect(outcomeOf({ winner: SIDE.COMPUTER, base: 7, goCount: 0, baks: [], points: 7 })).toBe('lose');
  });

  it('고 하면 받을 점수를 미리 계산한다', () => {
    expect(goPreview(7, 0)).toEqual({ stop: 7, go: 8 });
    expect(goPreview(10, 2)).toEqual({ stop: 12, go: 24 });
  });

  it('고를 안 했으면 고 칩이 없고, 했으면 스톱할 때 점수를 붙인다', () => {
    expect(goChipOf(9, 0)).toBeNull();
    expect(goChipOf(8, 1)).toEqual({ count: 1, stopPoints: 9 });
    expect(goChipOf(8, 3)).toEqual({ count: 3, stopPoints: 20 });
  });
});
