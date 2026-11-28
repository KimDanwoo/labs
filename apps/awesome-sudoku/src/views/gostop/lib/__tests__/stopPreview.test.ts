import { GAME_ACTION, PHASE, SIDE } from '@views/gostop/config/game';
import { INITIAL_WALLET } from '@views/gostop/lib/money';
import { stopPayout } from '@views/gostop/lib/moneyView';
import { goTagOf, stopPreviewOf } from '@views/gostop/lib/stopPreview';
import { gameReducer, INITIAL_STATE } from '@views/gostop/model/reducer/gameReducer';
import type { GameState } from '@views/gostop/model/types/gostop';
import type { Wallet } from '@views/gostop/model/types/money';
import { describe, expect, it } from 'vitest';

const GWANGS = [0, 8, 28] as const;
const RIVAL_GWANG = 40;
const PI = [2, 3, 6, 7, 10, 11, 14, 15, 18, 19, 22, 23] as const;
const RICH = 1_000_000;

interface Deciding {
  mine: readonly number[];
  rival: readonly number[];
  goCount?: GameState['goCount'];
}

const decidingState = ({ mine, rival, goCount = { [SIDE.ME]: 0, [SIDE.COMPUTER]: 0 } }: Deciding): GameState => ({
  ...INITIAL_STATE,
  phase: PHASE.DECIDE,
  turn: SIDE.ME,
  goCount,
  table: { ...INITIAL_STATE.table, captured: { [SIDE.ME]: mine, [SIDE.COMPUTER]: rival } },
});

const walletOf = (rivalMoney: number): Wallet => ({
  ...INITIAL_WALLET,
  money: { [SIDE.ME]: RICH, [SIDE.COMPUTER]: rivalMoney },
});

const stopNow = (state: GameState) => gameReducer(state, { type: GAME_ACTION.STOP, side: SIDE.ME }).result;

const previewOf = (state: GameState) => stopPreviewOf(state, state.table);

describe('스톱 미리보기', () => {
  it('박이 없으면 기본 점수 그대로이고 스톱한 결과와 같다', () => {
    const state = decidingState({ mine: GWANGS, rival: [RIVAL_GWANG, ...PI] });
    const preview = previewOf(state);
    expect(preview.stop[SIDE.ME]).toEqual(stopNow(state));
    expect(stopPayout(walletOf(RICH), preview.stop[SIDE.ME])).toEqual({
      points: 3,
      amount: 300,
      isCapped: false,
      baks: [],
    });
  });

  it('피박이면 두 배가 미리 반영된다', () => {
    const state = decidingState({ mine: [...GWANGS, ...PI.slice(0, 10)], rival: [RIVAL_GWANG, ...PI.slice(10)] });
    const stop = previewOf(state).stop[SIDE.ME];
    expect(stop).toEqual(stopNow(state));
    expect(stopPayout(walletOf(RICH), stop)).toEqual({ points: 8, amount: 800, isCapped: false, baks: ['piBak'] });
  });

  it('광박이면 두 배가 미리 반영된다', () => {
    const state = decidingState({ mine: GWANGS, rival: [...PI] });
    const stop = previewOf(state).stop[SIDE.ME];
    expect(stop).toEqual(stopNow(state));
    expect(stop.baks).toEqual(['gwangBak']);
    expect(stop.points).toBe(6);
  });

  it('상대가 고를 부른 뒤 내가 스톱하면 고박이 붙는다', () => {
    const state = decidingState({
      mine: GWANGS,
      rival: [RIVAL_GWANG, ...PI],
      goCount: { [SIDE.ME]: 0, [SIDE.COMPUTER]: 1 },
    });
    const stop = previewOf(state).stop[SIDE.ME];
    expect(stop).toEqual(stopNow(state));
    expect(stop.baks).toEqual(['goBak']);
    expect(stop.points).toBe(6);
  });

  it('상대 머니가 모자라면 가진 만큼만 받는다', () => {
    const state = decidingState({ mine: [...GWANGS, ...PI.slice(0, 10)], rival: [RIVAL_GWANG, ...PI.slice(10)] });
    const payout = stopPayout(walletOf(500), previewOf(state).stop[SIDE.ME]);
    expect(payout).toEqual({ points: 8, amount: 500, isCapped: true, baks: ['piBak'] });
  });

  it('한 번 더 고하면 박 배수까지 같은 방식으로 계산한다', () => {
    const state = decidingState({
      mine: [...GWANGS, ...PI.slice(0, 10)],
      rival: [RIVAL_GWANG, ...PI.slice(10)],
      goCount: { [SIDE.ME]: 1, [SIDE.COMPUTER]: 0 },
    });
    const preview = previewOf(state);
    expect(preview.stop[SIDE.ME].points).toBe((4 + 1) * 2);
    expect(preview.nextGo.points).toBe((4 + 2) * 2);
  });

  it('고 칩은 고를 부른 쪽에만 붙고 시트의 스톱 점수와 같다', () => {
    const state = decidingState({
      mine: [...GWANGS, ...PI.slice(0, 10)],
      rival: [RIVAL_GWANG, ...PI.slice(10)],
      goCount: { [SIDE.ME]: 1, [SIDE.COMPUTER]: 0 },
    });
    const preview = previewOf(state);
    expect(goTagOf(0, preview.stop[SIDE.ME])).toBeNull();
    expect(goTagOf(1, preview.stop[SIDE.ME])).toEqual({ count: 1, stopPoints: preview.stop[SIDE.ME].points });
  });
});
