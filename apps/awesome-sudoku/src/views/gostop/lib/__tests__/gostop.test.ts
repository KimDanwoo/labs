import type { RandomInt } from '@shared/lib/random';
import { CARD_KIND, CARDS, RIBBON } from '@views/gostop/config/cards';
import { GAME_ACTION, PHASE, SIDE, TURN_EVENT } from '@views/gostop/config/game';
import { chooseCard, shouldGo } from '@views/gostop/lib/ai';
import { dealTable, hasFullMonth, shuffleDealableDeck } from '@views/gostop/lib/deck';
import { countPi, goPoints, scoreOf } from '@views/gostop/lib/score';
import { resolveTurn } from '@views/gostop/lib/turn';
import { gameReducer, INITIAL_STATE } from '@views/gostop/model/reducer/gameReducer';
import type { GameState, Table } from '@views/gostop/model/types/gostop';
import { describe, expect, it } from 'vitest';

const seeded = (seed: number): RandomInt => {
  let state = seed;
  return (bound) => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state % bound;
  };
};

interface TableParts {
  me?: number[];
  computer?: number[];
  floor?: number[];
  deck?: number[];
  myCaptured?: number[];
  rivalCaptured?: number[];
}

const tableOf = (parts: TableParts): Table => ({
  hands: { [SIDE.ME]: parts.me ?? [], [SIDE.COMPUTER]: parts.computer ?? [] },
  floor: parts.floor ?? [],
  deck: parts.deck ?? [],
  captured: { [SIDE.ME]: parts.myCaptured ?? [], [SIDE.COMPUTER]: parts.rivalCaptured ?? [] },
});

const playingState = (parts: TableParts): GameState => ({ ...INITIAL_STATE, phase: PHASE.PLAY, table: tableOf(parts) });

const allCards = (table: Table): number[] =>
  [...Object.values(table.hands), table.floor, table.deck, ...Object.values(table.captured)].flat();

describe('화투 48장 구성', () => {
  it('광 5·열끗 9·띠 10·피 24장이고 피 값 합은 쌍피 2장을 더해 26이다', () => {
    const countOf = (kind: string) => CARDS.filter((card) => card.kind === kind).length;
    expect([countOf(CARD_KIND.GWANG), countOf(CARD_KIND.YEOL), countOf(CARD_KIND.TTI), countOf(CARD_KIND.PI)]).toEqual([
      5, 9, 10, 24,
    ]);
    expect(countPi(CARDS.map((card) => card.id))).toBe(26);
  });

  it('고도리는 2·4·8월 열끗이고 홍단·청단·초단이 3장씩, 비띠가 1장이다', () => {
    expect(CARDS.filter((card) => card.isGodori).map((card) => card.month)).toEqual([2, 4, 8]);
    const ribbonCount = (ribbon: string) => CARDS.filter((card) => card.ribbon === ribbon).length;
    expect([RIBBON.HONG, RIBBON.CHEONG, RIBBON.CHO, RIBBON.PLAIN].map(ribbonCount)).toEqual([3, 3, 3, 1]);
  });

  it('달마다 4장씩이고 카드 번호는 0부터 47까지 한 번씩이다', () => {
    expect(CARDS.map((card) => card.id)).toEqual(Array.from({ length: 48 }, (_, id) => id));
    expect(new Set(CARDS.map((card) => card.month)).size).toBe(12);
  });

  it('섞은 패는 손 10장씩·바닥 8장·더미 20장으로 나뉘고 바닥에 같은 달 4장이 깔리지 않는다', () => {
    const random = seeded(7);
    Array.from({ length: 50 }).forEach(() => {
      const table = dealTable(shuffleDealableDeck(random));
      expect([table.hands.me.length, table.hands.computer.length, table.floor.length, table.deck.length]).toEqual([
        10, 10, 8, 20,
      ]);
      expect(hasFullMonth(table.floor)).toBe(false);
      expect(new Set(allCards(table)).size).toBe(48);
    });
  });
});

describe('점수', () => {
  it('광은 3장 3점, 비광이 낀 3장 2점, 4장 4점, 5장 15점이다', () => {
    expect(scoreOf([0, 8, 28]).gwang).toBe(3);
    expect(scoreOf([0, 8, 44]).gwang).toBe(2);
    expect(scoreOf([0, 8, 28, 44]).gwang).toBe(4);
    expect(scoreOf([0, 8, 28, 40, 44]).gwang).toBe(15);
    expect(scoreOf([0, 8]).gwang).toBe(0);
  });

  it('고도리 5점, 홍단·청단·초단 각 3점이고 띠 장수 점수와 따로 센다', () => {
    expect(scoreOf([4, 12, 29]).godori).toBe(5);
    expect(scoreOf([1, 5, 9]).dan).toBe(3);
    expect(scoreOf([1, 5, 9, 21, 33, 37]).dan).toBe(6);
    expect(scoreOf([1, 5, 9, 21, 33]).tti).toBe(1);
    expect(scoreOf([13, 17, 46]).dan).toBe(0);
  });

  it('열끗·띠는 5장부터, 피는 10장부터 1점이고 한 장마다 1점씩 더한다', () => {
    expect(scoreOf([4, 12, 16, 20]).yeol).toBe(0);
    expect(scoreOf([16, 20, 24, 32, 36, 45]).yeol).toBe(2);
    expect(scoreOf([2, 3, 6, 7, 10, 11, 14, 15, 18]).pi).toBe(0);
    expect(scoreOf([2, 3, 6, 7, 10, 11, 14, 15, 41]).pi).toBe(1);
    expect(scoreOf([2, 3, 6, 7, 10, 11, 14, 15, 41, 47]).pi).toBe(3);
  });

  it('1고 +1점, 2고 +2점, 3고부터는 한 번마다 두 배다', () => {
    expect([0, 1, 2, 3, 4].map((goCount) => goPoints(7, goCount))).toEqual([7, 8, 9, 18, 36]);
  });
});

describe('한 차례 처리', () => {
  it('빈 바닥에 낸 패를 같은 달 뒤집은 패로 바로 먹으면 쪽이고 상대 피를 1장(홑피 먼저) 가져온다', () => {
    const { table, report } = resolveTurn(tableOf({ me: [2], deck: [3], rivalCaptured: [41, 6] }), SIDE.ME, 2);
    expect(report.events).toEqual([TURN_EVENT.JJOK]);
    expect(report.taken).toEqual([2, 3]);
    expect(report.stolen).toEqual([6]);
    expect(table.captured.computer).toEqual([41]);
  });

  it('바닥 1장과 짝을 맞췄는데 뒤집은 패도 같은 달이면 뻑이라 세 장이 바닥에 남는다', () => {
    const { table, report } = resolveTurn(tableOf({ me: [2], floor: [0], deck: [3] }), SIDE.ME, 2);
    expect(report.events).toEqual([TURN_EVENT.PPUK]);
    expect(table.floor).toEqual([0, 2, 3]);
    expect(table.captured.me).toEqual([]);
  });

  it('바닥 2장에 내고 뒤집은 패도 같은 달이면 따닥으로 4장을 먹는다', () => {
    const { report } = resolveTurn(tableOf({ me: [2], floor: [0, 1], deck: [3], rivalCaptured: [6] }), SIDE.ME, 2);
    expect(report.events).toEqual([TURN_EVENT.TTADAK]);
    expect([...report.taken].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
    expect(report.stolen).toEqual([6]);
  });

  it('바닥에 쌓인 같은 달 3장을 마지막 패로 가져오면 넷 다 먹고 피를 1장 받는다', () => {
    const { table, report } = resolveTurn(
      tableOf({ me: [3], floor: [0, 1, 2, 4], deck: [20, 21], rivalCaptured: [6] }),
      SIDE.ME,
      3,
    );
    expect(report.events).toEqual([TURN_EVENT.COLLECT]);
    expect(table.floor).toEqual([4, 20]);
    expect(report.stolen).toEqual([6]);
  });

  it('같은 달이 바닥에 2장이면 값이 큰 패를 골라 먹는다', () => {
    const { table, report } = resolveTurn(tableOf({ me: [3], floor: [1, 2], deck: [20, 21] }), SIDE.ME, 3);
    expect(report.taken).toEqual([3, 1]);
    expect(table.floor).toEqual([2, 20]);
  });

  it('바닥을 다 쓸어 가면 싹쓸이로 피를 1장 받고, 마지막 차례에서는 싹쓸이를 세지 않는다', () => {
    const swept = resolveTurn(tableOf({ me: [2], floor: [0, 20], deck: [21, 30], rivalCaptured: [6] }), SIDE.ME, 2);
    expect(swept.report.events).toEqual([TURN_EVENT.SWEEP]);
    expect(swept.table.floor).toEqual([]);
    const lastTurn = resolveTurn(tableOf({ me: [2], floor: [0, 20], deck: [21], rivalCaptured: [6] }), SIDE.ME, 2);
    expect(lastTurn.report.events).toEqual([]);
  });
});

describe('고·스톱 흐름', () => {
  const nearWin = (): GameState =>
    playingState({
      me: [30, 16],
      computer: [17, 18],
      floor: [29],
      deck: [20, 21],
      myCaptured: [0, 8, 28, 40, 4, 12],
    });

  it('7점을 넘기면 고·스톱을 고르는 단계가 되고, 스톱하면 광박을 곱해 끝난다', () => {
    const deciding = gameReducer(nearWin(), { type: GAME_ACTION.PLAY, side: SIDE.ME, card: 30 });
    expect(deciding.phase).toBe(PHASE.DECIDE);
    const over = gameReducer(deciding, { type: GAME_ACTION.STOP, side: SIDE.ME });
    expect(over.phase).toBe(PHASE.OVER);
    expect(over.result).toMatchObject({ winner: SIDE.ME, base: 9, baks: ['gwangBak'], points: 18 });
  });

  it('고를 하면 상대 차례로 넘어가고, 점수가 더 올라야 다시 고를 고를 수 있다', () => {
    const deciding = gameReducer(nearWin(), { type: GAME_ACTION.PLAY, side: SIDE.ME, card: 30 });
    const went = gameReducer(deciding, { type: GAME_ACTION.GO, side: SIDE.ME });
    expect([went.phase, went.turn, went.goCount.me, went.goScore.me]).toEqual([PHASE.PLAY, SIDE.COMPUTER, 1, 9]);
    const afterRival = gameReducer(went, { type: GAME_ACTION.PLAY, side: SIDE.COMPUTER, card: 17 });
    const afterMe = gameReducer(afterRival, { type: GAME_ACTION.PLAY, side: SIDE.ME, card: 16 });
    expect(afterMe.phase).toBe(PHASE.PLAY);
  });

  it('고를 부른 쪽이 지면 고박으로 두 배가 된다', () => {
    const state: GameState = {
      ...nearWin(),
      goCount: { [SIDE.ME]: 0, [SIDE.COMPUTER]: 1 },
      table: tableOf({
        me: [30, 16],
        computer: [17],
        floor: [29],
        deck: [20, 21],
        myCaptured: [0, 8, 28, 40, 4, 12],
        rivalCaptured: [44],
      }),
    };
    const deciding = gameReducer(state, { type: GAME_ACTION.PLAY, side: SIDE.ME, card: 30 });
    const over = gameReducer(deciding, { type: GAME_ACTION.STOP, side: SIDE.ME });
    expect(over.result).toMatchObject({ baks: ['goBak'], points: 18 });
  });

  it('남은 패가 없으면 고를 고르지 않고 바로 스톱한다', () => {
    const state = playingState({ me: [30], computer: [], floor: [29], deck: [20], myCaptured: [0, 8, 28, 40, 4, 12] });
    const over = gameReducer(state, { type: GAME_ACTION.PLAY, side: SIDE.ME, card: 30 });
    expect(over.phase).toBe(PHASE.OVER);
    expect(over.result?.winner).toBe(SIDE.ME);
  });

  it('둘 다 패를 다 낼 때까지 7점을 못 넘기면 나가리다', () => {
    const state = playingState({ me: [2], computer: [16], floor: [20], deck: [21, 30] });
    const afterMe = gameReducer(state, { type: GAME_ACTION.PLAY, side: SIDE.ME, card: 2 });
    const over = gameReducer(afterMe, { type: GAME_ACTION.PLAY, side: SIDE.COMPUTER, card: 16 });
    expect(over.phase).toBe(PHASE.OVER);
    expect(over.result).toMatchObject({ winner: null, points: 0 });
  });

  it('차례가 아니거나 손에 없는 패는 낼 수 없다', () => {
    const state = nearWin();
    expect(gameReducer(state, { type: GAME_ACTION.PLAY, side: SIDE.COMPUTER, card: 17 })).toBe(state);
    expect(gameReducer(state, { type: GAME_ACTION.PLAY, side: SIDE.ME, card: 17 })).toBe(state);
  });
});

describe('컴퓨터끼리 끝까지 두기', () => {
  const playOut = (seed: number): GameState => {
    const random = seeded(seed);
    let state = gameReducer(INITIAL_STATE, { type: GAME_ACTION.DEAL, deck: shuffleDealableDeck(random) });
    while (state.phase !== PHASE.OVER) {
      const side = state.turn;
      if (state.phase === PHASE.DECIDE) {
        state = gameReducer(state, { type: shouldGo(state, side) ? GAME_ACTION.GO : GAME_ACTION.STOP, side });
        continue;
      }
      state = gameReducer(state, { type: GAME_ACTION.PLAY, side, card: chooseCard(state.table, side, random) });
      expect(new Set(allCards(state.table)).size).toBe(48);
      expect(allCards(state.table)).toHaveLength(48);
    }
    return state;
  };

  it('200판 모두 카드 48장을 잃지 않고 승패나 나가리로 끝난다', () => {
    const results = Array.from({ length: 200 }, (_, seed) => playOut(seed + 1).result);
    expect(results.every((result) => result !== null)).toBe(true);
    const winners = new Set(results.map((result) => result?.winner));
    expect(winners.has(SIDE.ME) && winners.has(SIDE.COMPUTER)).toBe(true);
    expect(results.filter((result) => result?.winner).every((result) => (result?.points ?? 0) >= 7)).toBe(true);
  });
});
