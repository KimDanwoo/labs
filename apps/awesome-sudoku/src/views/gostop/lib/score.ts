import { CARD_KIND, RIBBON } from '@views/gostop/config/cards';
import {
  ADDITIVE_GO_LIMIT,
  BAK_MULTIPLIER,
  DAN_SCORE,
  DAN_SET_SIZE,
  GODORI_SCORE,
  GODORI_SET_SIZE,
  GWANG_SCORE,
  GWANG_SCORE_BY_COUNT,
  MEONG_TTA_YEOL_COUNT,
  PI_BAK_MAX_PI,
  PI_BASE_COUNT,
  THREE_GWANG_COUNT,
  TTI_BASE_COUNT,
  YEOL_BASE_COUNT,
} from '@views/gostop/config/score';
import { cardOf, rivalOf } from '@views/gostop/lib/cards';
import type { Bak, CardKind, GameResult, GameState, ScoreBreakdown, Side } from '@views/gostop/model/types/gostop';

const DAN_RIBBONS = [RIBBON.HONG, RIBBON.CHEONG, RIBBON.CHO] as const;

const cardsOfKind = (captured: readonly number[], kind: CardKind) =>
  captured.map(cardOf).filter((card) => card.kind === kind);

const countAbove = (count: number, base: number): number => (count >= base ? count - base + 1 : 0);

export const countPi = (captured: readonly number[]): number =>
  cardsOfKind(captured, CARD_KIND.PI).reduce((sum, card) => sum + card.piValue, 0);

export function gwangScore(captured: readonly number[]): number {
  const gwangs = cardsOfKind(captured, CARD_KIND.GWANG);
  const isRainThree = gwangs.length === THREE_GWANG_COUNT && gwangs.some((card) => card.isRainGwang);
  if (isRainThree) return GWANG_SCORE.threeWithRain;
  return GWANG_SCORE_BY_COUNT[gwangs.length] ?? 0;
}

function danScore(captured: readonly number[]): number {
  const ribbons = cardsOfKind(captured, CARD_KIND.TTI).map((card) => card.ribbon);
  const completed = DAN_RIBBONS.filter((ribbon) => ribbons.filter((owned) => owned === ribbon).length === DAN_SET_SIZE);
  return completed.length * DAN_SCORE;
}

export function scoreOf(captured: readonly number[]): ScoreBreakdown {
  const yeols = cardsOfKind(captured, CARD_KIND.YEOL);
  const hasGodori = yeols.filter((card) => card.isGodori).length === GODORI_SET_SIZE;
  const parts = {
    gwang: gwangScore(captured),
    yeol: countAbove(yeols.length, YEOL_BASE_COUNT),
    tti: countAbove(cardsOfKind(captured, CARD_KIND.TTI).length, TTI_BASE_COUNT),
    pi: countAbove(countPi(captured), PI_BASE_COUNT),
    godori: hasGodori ? GODORI_SCORE : 0,
    dan: danScore(captured),
  };
  const total = Object.values(parts).reduce((sum, value) => sum + value, 0);
  return { ...parts, total };
}

function baksOf(state: GameState, winner: Side, score: ScoreBreakdown): Bak[] {
  const loser = rivalOf(winner);
  const loserCards = state.table.captured[loser];
  const checks: Record<Bak, boolean> = {
    piBak: score.pi > 0 && countPi(loserCards) <= PI_BAK_MAX_PI,
    gwangBak: score.gwang > 0 && cardsOfKind(loserCards, CARD_KIND.GWANG).length === 0,
    meongTta: cardsOfKind(state.table.captured[winner], CARD_KIND.YEOL).length >= MEONG_TTA_YEOL_COUNT,
    goBak: state.goCount[loser] > 0,
  };
  return (Object.keys(checks) as Bak[]).filter((bak) => checks[bak]);
}

export function goPoints(base: number, goCount: number): number {
  const bonus = Math.min(goCount, ADDITIVE_GO_LIMIT);
  const multiplier = goCount > ADDITIVE_GO_LIMIT ? 2 ** (goCount - ADDITIVE_GO_LIMIT) : 1;
  return (base + bonus) * multiplier;
}

export function winResult(state: GameState, winner: Side): GameResult {
  const score = scoreOf(state.table.captured[winner]);
  const goCount = state.goCount[winner];
  const baks = baksOf(state, winner, score);
  const points = goPoints(score.total, goCount) * BAK_MULTIPLIER ** baks.length;
  return { winner, base: score.total, goCount, baks, points };
}

export const DRAW_RESULT: GameResult = { winner: null, base: 0, goCount: 0, baks: [], points: 0 };
