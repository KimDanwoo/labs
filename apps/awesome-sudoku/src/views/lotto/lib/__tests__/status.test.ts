import { describe, expect, it } from 'vitest';

import {
  freshDrawOf,
  hasRunResult,
  isSameTicket,
  resultTitleOf,
  statusOf,
  type StatusInput,
} from '@views/lotto/lib/status';
import type { SimulationRun } from '@views/lotto/model/hooks/useSimulation';
import type { SingleDraw } from '@views/lotto/model/hooks/useSingleDraw';
import type { SimulationRequest, Tally } from '@views/lotto/model/types/lotto';

const TICKET = [1, 2, 3, 4, 5, 6];
const BULK: SimulationRequest = { mode: 'bulk', ticket: TICKET, count: 10_000 };
const JACKPOT: SimulationRequest = { mode: 'jackpot', ticket: TICKET, limit: 100_000_000 };

const tallyOf = (tickets: number, counts: Partial<Tally['counts']> = {}): Tally => ({
  tickets,
  counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, ...counts },
});

const runOf = (run: Partial<SimulationRun>): SimulationRun => ({ status: 'idle', request: null, result: null, ...run });

const drawOf = (numbers: number[], bonus: number, rank: SingleDraw['rank']): SingleDraw => ({
  round: 1,
  ticket: [...TICKET],
  draw: { numbers, bonus },
  rank,
});

const inputOf = (input: Partial<StatusInput>): StatusInput => ({
  ticket: TICKET,
  singleDraw: null,
  run: runOf({}),
  isRunNewer: false,
  ...input,
});

describe('isSameTicket · freshDrawOf', () => {
  it('값으로 비교한다', () => {
    expect(isSameTicket([1, 2], [1, 2])).toBe(true);
    expect(isSameTicket([1, 2], [1, 3])).toBe(false);
    expect(isSameTicket([1, 2], [1, 2, 3])).toBe(false);
  });

  it('번호를 바꾸면 지난 추첨은 버린다', () => {
    const draw = drawOf([1, 2, 3, 10, 11, 12], 13, 5);
    expect(freshDrawOf(draw, [...TICKET])).toBe(draw);
    expect(freshDrawOf(draw, [1, 2, 3, 4, 5, 7])).toBeNull();
    expect(freshDrawOf(null, TICKET)).toBeNull();
  });
});

describe('hasRunResult', () => {
  it('끝났고 한 장이라도 샀을 때만', () => {
    expect(
      hasRunResult(runOf({ status: 'done', request: BULK, result: { tally: tallyOf(10), hasJackpot: false } })),
    ).toBe(true);
    expect(hasRunResult(runOf({ status: 'cancelled', request: BULK, result: null }))).toBe(false);
    expect(
      hasRunResult(runOf({ status: 'running', request: BULK, result: { tally: tallyOf(10), hasJackpot: false } })),
    ).toBe(false);
  });
});

describe('statusOf', () => {
  it('고르는 중이면 개수를 센다', () => {
    expect(statusOf(inputOf({ ticket: [3, 17, 40] })).text).toBe('번호 6개를 골라요 · 3/6');
  });

  it('다 골랐고 아무것도 안 했으면 준비', () => {
    expect(statusOf(inputOf({})).kind).toBe('ready');
  });

  it('추첨 결과를 맞힌 개수와 등수로 보인다', () => {
    expect(statusOf(inputOf({ singleDraw: drawOf([1, 2, 3, 4, 20, 21], 22, 4) })).text).toBe('4개 맞힘 · 4등');
    expect(statusOf(inputOf({ singleDraw: drawOf([1, 2, 30, 31, 32, 33], 34, null) })).text).toBe('2개 맞힘 · 낙첨');
    expect(statusOf(inputOf({ singleDraw: drawOf([1, 2, 3, 4, 5, 40], 6, 2) })).text).toBe('5개 + 보너스 맞힘 · 2등');
  });

  it('몰아 사기 중에는 진행을 보이고, 읽어 줄 문장은 고정한다', () => {
    const status = statusOf(
      inputOf({
        run: runOf({ status: 'running', request: BULK, result: { tally: tallyOf(6_000), hasJackpot: false } }),
      }),
    );
    expect(status.text).toBe('1만 장 중 6,000장…');
    expect(status.announcement).toBe('1만 장을 몰아 사는 중이에요');
  });

  it('1등 모드 진행', () => {
    const run = runOf({
      status: 'running',
      request: JACKPOT,
      result: { tally: tallyOf(4_120_000), hasJackpot: false },
    });
    expect(statusOf(inputOf({ run })).text).toBe('1등까지 412만 장째…');
  });

  it('끝난 실행이 추첨보다 나중이면 실행 결과를 보인다', () => {
    const run = runOf({
      status: 'done',
      request: BULK,
      result: { tally: tallyOf(10_000, { 5: 200 }), hasJackpot: false },
    });
    const singleDraw = drawOf([1, 2, 3, 4, 20, 21], 22, 4);
    expect(statusOf(inputOf({ run, singleDraw, isRunNewer: true })).text).toBe('1만 장 샀어요 · 수익률 -90.0%');
    expect(statusOf(inputOf({ run, singleDraw, isRunNewer: false })).kind).toBe('drawn');
  });

  it('1등 모드 결과 셋', () => {
    const won = runOf({
      status: 'done',
      request: JACKPOT,
      result: { tally: tallyOf(11_500_000, { 1: 1 }), hasJackpot: true },
    });
    const missed = runOf({
      status: 'done',
      request: JACKPOT,
      result: { tally: tallyOf(100_000_000), hasJackpot: false },
    });
    const stopped = runOf({
      status: 'cancelled',
      request: JACKPOT,
      result: { tally: tallyOf(3_000), hasJackpot: false },
    });
    expect(statusOf(inputOf({ run: won, isRunNewer: true })).text).toBe('1,150만 장째에 1등!');
    expect(statusOf(inputOf({ run: missed, isRunNewer: true })).text).toBe('1억 장을 사도 1등은 없었어요');
    expect(statusOf(inputOf({ run: stopped, isRunNewer: true })).text).toBe('3,000장에서 멈췄어요');
  });

  it('다른 번호로 돌린 결과는 보이지 않는다', () => {
    const run = runOf({ status: 'done', request: BULK, result: { tally: tallyOf(10_000), hasJackpot: false } });
    expect(statusOf(inputOf({ run, isRunNewer: true, ticket: [1, 2, 3, 4, 5, 7] })).kind).toBe('ready');
  });
});

describe('resultTitleOf', () => {
  it('모드와 끝난 방식에 따라 제목을 만든다', () => {
    const bulk = runOf({ status: 'done', request: BULK, result: { tally: tallyOf(10_000), hasJackpot: false } });
    const bulkStopped = runOf({
      status: 'cancelled',
      request: BULK,
      result: { tally: tallyOf(4_000), hasJackpot: false },
    });
    expect(resultTitleOf(bulk)).toBe('1만 장 몰아 사기 결과');
    expect(resultTitleOf(bulkStopped)).toBe('4,000장에서 멈췄어요');
  });
});
