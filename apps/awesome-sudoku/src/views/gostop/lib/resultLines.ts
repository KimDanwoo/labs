import { CARD_KIND } from '@views/gostop/config/cards';
import { JOKBO_LABEL, RECORD_COPY, RESULT_COPY, SCORE_LINE_LABEL } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { cardOf, rivalOf } from '@views/gostop/lib/cards';
import { completedDans } from '@views/gostop/lib/jokbo';
import { countPi } from '@views/gostop/lib/score';
import type { Bak, CardKind, GameResult, ScoreBreakdown, Side } from '@views/gostop/model/types/gostop';
import type { GameRecord } from '@views/gostop/model/types/record';
import type { ScorePart } from '@views/gostop/model/types/view';

export interface ScoreLine {
  key: ScorePart;
  label: string;
  points: number;
}

export interface BakLine {
  bak: Bak;
  reason: string;
}

const SCORE_PARTS: readonly ScorePart[] = ['godori', 'dan', 'gwang', 'yeol', 'tti', 'pi'];

function partLabel(part: ScorePart, captured: readonly number[]): string {
  const isDan = part === 'dan';
  if (!isDan) return SCORE_LINE_LABEL[part];
  const names = completedDans(captured).map((key) => JOKBO_LABEL[key]);
  return names.length > 0 ? names.join(RESULT_COPY.danJoin) : SCORE_LINE_LABEL.dan;
}

export const scoreLines = (score: ScoreBreakdown, captured: readonly number[]): ScoreLine[] =>
  SCORE_PARTS.filter((part) => score[part] > 0).map((part) => ({
    key: part,
    label: partLabel(part, captured),
    points: score[part],
  }));

const POSSESSIVE: Record<Side, string> = { [SIDE.ME]: RESULT_COPY.me, [SIDE.COMPUTER]: RESULT_COPY.rival };
const SUBJECT: Record<Side, string> = { [SIDE.ME]: RESULT_COPY.meSubject, [SIDE.COMPUTER]: RESULT_COPY.rivalSubject };

const kindCount = (captured: readonly number[], kind: CardKind): number =>
  captured.filter((id) => cardOf(id).kind === kind).length;

const cards = (count: number): string => `${count}${RESULT_COPY.cardUnit}`;

export function bakLines(
  result: GameResult,
  captured: Record<Side, readonly number[]>,
  goCount: Record<Side, number>,
): BakLine[] {
  const { winner } = result;
  if (!winner) return [];
  const loser = rivalOf(winner);
  const reasons: Record<Bak, string> = {
    piBak: `${POSSESSIVE[loser]} ${RESULT_COPY.pi} ${cards(countPi(captured[loser]))}`,
    gwangBak: `${POSSESSIVE[loser]} ${RESULT_COPY.gwang} ${cards(kindCount(captured[loser], CARD_KIND.GWANG))}`,
    meongTta: `${POSSESSIVE[winner]} ${RESULT_COPY.yeol} ${cards(kindCount(captured[winner], CARD_KIND.YEOL))}`,
    goBak: `${SUBJECT[loser]} ${goCount[loser]}${RESULT_COPY.goBakTail}`,
  };
  return result.baks.map((bak) => ({ bak, reason: reasons[bak] }));
}

export function recordLine(record: GameRecord): string {
  const tally = [
    `${record.played}${RECORD_COPY.played}`,
    `${record.wins}${RECORD_COPY.wins}`,
    `${record.losses}${RECORD_COPY.losses}`,
    `${record.draws}${RECORD_COPY.draws}`,
  ].join(' ');
  const streak = `${RECORD_COPY.streak} ${record.streak}`;
  const best = `${RECORD_COPY.bestPoints} ${record.bestPoints}${RESULT_COPY.pointsUnit}`;
  return [tally, streak, best].join(` ${RESULT_COPY.recordJoin} `);
}
