import { DECK_SIZE } from '@views/gostop/config/cards';
import { GAME_ACTION, PHASE, SIDE } from '@views/gostop/config/game';
import { FLIGHT_ORIGIN, SPEED_FACTOR, STEP_KIND } from '@views/gostop/config/playback';
import { boardView } from '@views/gostop/lib/board';
import { flightFrames, flightPlanOf } from '@views/gostop/lib/flight';
import { transitionSteps } from '@views/gostop/lib/playback';
import { floorSlots } from '@views/gostop/lib/table';
import { gameReducer, INITIAL_STATE } from '@views/gostop/model/reducer/gameReducer';
import type { GameAction, GameState } from '@views/gostop/model/types/gostop';
import { describe, expect, it } from 'vitest';

const DEAL: GameAction = { type: GAME_ACTION.DEAL, deck: Array.from({ length: 48 }, (_, id) => id) };
const dealt = gameReducer(INITIAL_STATE, DEAL);
const [dealStep] = transitionSteps(INITIAL_STATE, dealt, DEAL);

describe('화면용 판', () => {
  it('준비 화면에는 48장 더미가 그대로 놓여 있다', () => {
    expect(boardView(INITIAL_STATE, null).deckCount).toBe(DECK_SIZE);
    expect(boardView(dealt, null).deckCount).toBe(dealt.table.deck.length);
  });

  it('재생 중에는 내 입력·결정·결과를 잠그고 단계의 판을 보여 준다', () => {
    const deciding: GameState = { ...dealt, phase: PHASE.DECIDE };
    const view = boardView(deciding, dealStep ?? null);
    expect(view.isPlaying).toBe(true);
    expect(view.isMyTurn).toBe(false);
    expect(view.isDeciding).toBe(false);
    expect(view.result).toBeNull();
    expect(view.phase).toBe(PHASE.PLAY);
  });

  it('재생이 끝나면 리듀서 상태 그대로 내 차례를 연다', () => {
    const view = boardView(dealt, null);
    expect(view.isMyTurn).toBe(true);
    expect(view.activeSide).toBe(SIDE.ME);
    expect(view.myHand).toBe(dealt.table.hands.me);
    expect(view.deckCount).toBe(dealt.table.deck.length);
  });

  it('바닥 패를 달별 자리에 놓인 순서대로 묶는다', () => {
    expect(floorSlots([5, 4, 40, 6])).toEqual({ 2: [5, 4, 6], 11: [40] });
  });
});

describe('카드 비행 계획', () => {
  it('reduced-motion이거나 단계가 없으면 날리지 않는다', () => {
    expect(flightPlanOf(null, SPEED_FACTOR.normal, false)).toBeNull();
    expect(flightPlanOf(dealStep ?? null, SPEED_FACTOR.normal, true)).toBeNull();
  });

  it('상대가 낸 패는 상대 손에서, 나머지 새 패는 더미에서 출발한다', () => {
    const base = dealStep ?? transitionSteps(INITIAL_STATE, dealt, DEAL)[0];
    if (!base) throw new Error('딜 단계가 없어요');
    const rivalPlay = { ...base, kind: STEP_KIND.PLAY, side: SIDE.COMPUTER };
    const myPlay = { ...base, kind: STEP_KIND.PLAY, side: SIDE.ME };
    expect(flightPlanOf(rivalPlay, SPEED_FACTOR.normal, false)?.origin).toBe(FLIGHT_ORIGIN.COMPUTER);
    expect(flightPlanOf(myPlay, SPEED_FACTOR.normal, false)?.origin).toBe(FLIGHT_ORIGIN.DECK);
    expect(flightPlanOf(base, SPEED_FACTOR.normal, false)?.isDeal).toBe(true);
    const normal = flightPlanOf(myPlay, SPEED_FACTOR.normal, false)?.durationMs ?? 0;
    const fast = flightPlanOf(myPlay, SPEED_FACTOR.fast, false)?.durationMs ?? 0;
    expect(fast).toBeLessThan(normal);
  });

  it('위치·크기 차이를 transform으로만 되돌리고, 같은 자리면 날리지 않는다', () => {
    const to = { x: 100, y: 200, width: 40, height: 60 };
    expect(flightFrames(to, to, false)).toBeNull();
    const frames = flightFrames({ x: 10, y: 20, width: 80, height: 120 }, to, true);
    expect(frames?.[0]).toMatchObject({ transform: 'translate(-90px, -180px) scale(2, 2)', opacity: 0.4 });
    expect(frames?.[1]).toMatchObject({ transform: 'none', opacity: 1 });
    expect(Object.keys(frames?.[0] ?? {}).sort()).toEqual(['opacity', 'transform', 'transformOrigin']);
  });
});
