import { describe, expect, it } from 'vitest';

import {
  ballToneOf,
  drawEmphasisOf,
  jackpotOutcomeOf,
  observedOddsTextOf,
  phaseOfMode,
  profitToneOf,
  progressPercentOf,
  progressRatioOf,
  revealStyleOf,
  ticketSlotsOf,
} from '@views/lotto/lib/simulationView';
import type { SimulationRun } from '@views/lotto/model/hooks/useSimulation';
import type { SimulationRequest, Tally } from '@views/lotto/model/types/lotto';

const TICKET = [1, 2, 3, 4, 5, 6];
const BULK: SimulationRequest = { mode: 'bulk', ticket: TICKET, count: 10_000 };
const JACKPOT: SimulationRequest = { mode: 'jackpot', ticket: TICKET, limit: 100_000_000 };

const tallyOf = (tickets: number, counts: Partial<Tally['counts']> = {}): Tally => ({
  tickets,
  counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, ...counts },
});

const runOf = (run: Partial<SimulationRun>): SimulationRun => ({ status: 'idle', request: null, result: null, ...run });

describe('ballToneOf', () => {
  it.each([
    [1, 'yellow'],
    [10, 'yellow'],
    [11, 'blue'],
    [20, 'blue'],
    [21, 'red'],
    [30, 'red'],
    [31, 'gray'],
    [40, 'gray'],
    [41, 'green'],
    [45, 'green'],
  ] as const)('%d번은 %s', (number, tone) => {
    expect(ballToneOf(number)).toBe(tone);
  });
});

describe('ticketSlotsOf', () => {
  it('6칸을 채우고 빈 칸은 null', () => {
    expect(ticketSlotsOf([3, 17])).toEqual([3, 17, null, null, null, null]);
  });
});

describe('revealStyleOf', () => {
  it('순서마다 지연을 늘린다', () => {
    expect(revealStyleOf(0).animationDelay).toBe('0ms');
    expect(revealStyleOf(2).animationDelay).not.toBe(revealStyleOf(1).animationDelay);
  });
});

describe('phaseOfMode', () => {
  it('다른 모드의 실행은 idle로 본다', () => {
    const run = runOf({ status: 'running', request: BULK });
    expect(phaseOfMode(run, 'bulk')).toBe('running');
    expect(phaseOfMode(run, 'jackpot')).toBe('idle');
  });
});

describe('progressRatioOf', () => {
  it('결과가 아직 없으면 0', () => {
    expect(progressRatioOf(runOf({ status: 'running', request: BULK }))).toBe(0);
  });

  it('목표 장수 대비 비율', () => {
    const run = runOf({ status: 'running', request: BULK, result: { tally: tallyOf(2_500), hasJackpot: false } });
    expect(progressRatioOf(run)).toBe(0.25);
    expect(progressPercentOf(progressRatioOf(run))).toBe(25);
  });
});

describe('jackpotOutcomeOf', () => {
  it('끝난 상태를 셋으로 나눈다', () => {
    const won = runOf({ status: 'done', request: JACKPOT, result: { tally: tallyOf(10, { 1: 1 }), hasJackpot: true } });
    const missed = runOf({ status: 'done', request: JACKPOT, result: { tally: tallyOf(10), hasJackpot: false } });
    const stopped = runOf({ status: 'cancelled', request: JACKPOT, result: null });
    expect(jackpotOutcomeOf(won)).toBe('won');
    expect(jackpotOutcomeOf(missed)).toBe('missed');
    expect(jackpotOutcomeOf(stopped)).toBe('stopped');
  });

  it('진행 중이거나 다른 모드면 그대로', () => {
    expect(jackpotOutcomeOf(runOf({ status: 'running', request: JACKPOT }))).toBe('running');
    expect(jackpotOutcomeOf(runOf({ status: 'done', request: BULK }))).toBe('idle');
  });
});

describe('profitToneOf', () => {
  it('손해·이득·없음을 구분한다', () => {
    expect(profitToneOf(tallyOf(10))).toBe('loss');
    expect(profitToneOf(tallyOf(10, { 4: 1 }))).toBe('gain');
    expect(profitToneOf(tallyOf(0))).toBe('plain');
  });
});

describe('observedOddsTextOf', () => {
  it('실행 전에는 줄표, 한 번도 안 나왔으면 없음, 나왔으면 1/n', () => {
    expect(observedOddsTextOf(null, 5, '없음')).toBe('—');
    expect(observedOddsTextOf(tallyOf(1_000), 1, '없음')).toBe('없음');
    expect(observedOddsTextOf(tallyOf(1_000, { 5: 20 }), 5, '없음')).toBe('1/50');
  });
});

describe('drawEmphasisOf', () => {
  it('내 번호에 있으면 맞힘, 없으면 흐리게', () => {
    expect(drawEmphasisOf(TICKET, 3)).toBe('matched');
    expect(drawEmphasisOf(TICKET, 30)).toBe('muted');
  });
});
