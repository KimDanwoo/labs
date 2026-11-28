import { PHASE, SIDE, TURN_EVENT } from '@views/gostop/config/game';
import { STEP_KIND } from '@views/gostop/config/playback';
import { MOOD, REACTION, REACTION_LINES } from '@views/gostop/config/rival';
import { rivalReaction } from '@views/gostop/lib/rival';
import { INITIAL_STATE } from '@views/gostop/model/reducer/gameReducer';
import type { GameState, Side, TurnReport } from '@views/gostop/model/types/gostop';
import type { CutInTone, PlaybackStep } from '@views/gostop/model/types/playback';
import { describe, expect, it } from 'vitest';

const turn = (side: Side, extra: Partial<TurnReport> = {}): TurnReport => ({
  side,
  played: 0,
  flipped: null,
  taken: [],
  stolen: [],
  events: [],
  ...extra,
});

const playing = (extra: Partial<GameState> = {}): GameState => ({ ...INITIAL_STATE, phase: PHASE.PLAY, ...extra });

const stepOf = (kind: PlaybackStep['kind'], tone: CutInTone | null): PlaybackStep => ({
  kind,
  side: null,
  table: INITIAL_STATE.table,
  held: null,
  revealed: null,
  gathering: [],
  sound: null,
  cutIn: tone ? { label: 'x', tone, power: 1 } : null,
  durationMs: 100,
});

const over = (winner: Side | null): GameState =>
  playing({ phase: PHASE.OVER, result: { winner, base: 7, goCount: 0, baks: [], points: 7 } });

describe('상대 캐릭터 반응 — 재생 중', () => {
  it('컷인이 없는 단계에서는 평소 표정이고 말이 없다', () => {
    const reaction = rivalReaction(over(SIDE.COMPUTER), stepOf(STEP_KIND.PLAY, null));
    expect(reaction).toEqual({ reaction: REACTION.QUIET, mood: MOOD.IDLE, line: null });
  });

  it('결과가 정해진 판도 재생이 끝나기 전에는 결과 표정을 미리 보이지 않는다', () => {
    expect(rivalReaction(over(SIDE.ME), stepOf(STEP_KIND.GATHER, null)).mood).toBe(MOOD.IDLE);
  });

  it('상대 컷인에는 웃고, 내 컷인에는 당황한다', () => {
    expect(rivalReaction(playing(), stepOf(STEP_KIND.GATHER, 'rival')).mood).toBe(MOOD.HAPPY);
    expect(rivalReaction(playing(), stepOf(STEP_KIND.GATHER, 'mine')).mood).toBe(MOOD.SHOCKED);
  });

  it('고를 부르는 컷인은 부른 쪽에 따라 으스대거나 화낸다', () => {
    expect(rivalReaction(playing(), stepOf(STEP_KIND.CALL, 'rival')).reaction).toBe(REACTION.RIVAL_GO);
    expect(rivalReaction(playing(), stepOf(STEP_KIND.CALL, 'mine')).reaction).toBe(REACTION.MY_GO);
  });

  it('스톱 컷인에서는 결과 표정이 나오기 전까지 조용하다', () => {
    expect(rivalReaction(over(SIDE.ME), stepOf(STEP_KIND.CALL, 'mine')).reaction).toBe(REACTION.QUIET);
    expect(rivalReaction(over(SIDE.COMPUTER), stepOf(STEP_KIND.CALL, 'rival')).reaction).toBe(REACTION.QUIET);
  });

  it('뻑은 낸 쪽의 실수라 상대가 내면 당황하고 내가 내면 웃는다', () => {
    const rivalPpuk = playing({ lastTurn: turn(SIDE.COMPUTER, { events: [TURN_EVENT.PPUK] }) });
    expect(rivalReaction(rivalPpuk, stepOf(STEP_KIND.GATHER, 'rival')).reaction).toBe(REACTION.RIVAL_BLUNDER);
    expect(rivalReaction(rivalPpuk, null).mood).toBe(MOOD.SHOCKED);
    const myPpuk = playing({ lastTurn: turn(SIDE.ME, { events: [TURN_EVENT.PPUK] }) });
    expect(rivalReaction(myPpuk, stepOf(STEP_KIND.LAND, 'mine')).reaction).toBe(REACTION.MY_BLUNDER);
    expect(rivalReaction(myPpuk, null).mood).toBe(MOOD.HAPPY);
  });
});

describe('상대 캐릭터 반응 — 멈춘 화면', () => {
  it('준비 화면과 평범한 차례 뒤에는 평소 표정이다', () => {
    expect(rivalReaction(INITIAL_STATE, null).mood).toBe(MOOD.IDLE);
    expect(rivalReaction(playing({ lastTurn: turn(SIDE.ME) }), null).mood).toBe(MOOD.IDLE);
  });

  it('내가 피를 뺏으면 화내고, 뺏지 못한 내 싹쓸이에는 당황한다', () => {
    const robbed = playing({ lastTurn: turn(SIDE.ME, { stolen: [5], events: [TURN_EVENT.JJOK] }) });
    expect(rivalReaction(robbed, null).reaction).toBe(REACTION.ROBBED);
    const sweep = playing({ lastTurn: turn(SIDE.ME, { events: [TURN_EVENT.SWEEP] }) });
    expect(rivalReaction(sweep, null).reaction).toBe(REACTION.MY_EVENT);
  });

  it('상대가 쪽·따닥을 내면 웃는다', () => {
    const game = playing({ lastTurn: turn(SIDE.COMPUTER, { events: [TURN_EVENT.TTADAK] }) });
    expect(rivalReaction(game, null).mood).toBe(MOOD.HAPPY);
  });

  it('내가 고·스톱을 고르는 중에는 당황한 얼굴로 스톱을 권한다', () => {
    const game = playing({ phase: PHASE.DECIDE, turn: SIDE.ME, lastTurn: turn(SIDE.ME) });
    expect(rivalReaction(game, null).reaction).toBe(REACTION.MY_DECIDING);
  });

  it('고를 부른 뒤 점수가 오르지 않은 차례에는 고 반응을 되풀이하지 않고 조용하다', () => {
    const base = { goScore: { [SIDE.ME]: 0, [SIDE.COMPUTER]: 0 } };
    const mine = playing({ ...base, goCount: { [SIDE.ME]: 1, [SIDE.COMPUTER]: 0 }, lastTurn: turn(SIDE.ME) });
    expect(rivalReaction(mine, null).reaction).toBe(REACTION.QUIET);
    const rival = playing({
      ...base,
      goCount: { [SIDE.ME]: 0, [SIDE.COMPUTER]: 1 },
      lastTurn: turn(SIDE.COMPUTER, { events: [TURN_EVENT.JJOK] }),
    });
    expect(rivalReaction(rival, null).reaction).toBe(REACTION.QUIET);
  });

  it('피를 뺏는 순간의 컷인부터 화낸다', () => {
    const robbed = playing({ lastTurn: turn(SIDE.ME, { stolen: [5], events: [TURN_EVENT.JJOK] }) });
    expect(rivalReaction(robbed, stepOf(STEP_KIND.GATHER, 'mine')).reaction).toBe(REACTION.ROBBED);
  });

  it('결과에 따라 으스대거나 분해하고, 나가리는 평소 표정이다', () => {
    expect(rivalReaction(over(SIDE.COMPUTER), null).mood).toBe(MOOD.GLOAT);
    expect(rivalReaction(over(SIDE.ME), null).mood).toBe(MOOD.ANGRY);
    expect(rivalReaction(over(null), null).reaction).toBe(REACTION.DRAW);
  });

  it('바닥 2장을 고르는 중에는 조용하다', () => {
    const game = playing({ phase: PHASE.CHOOSE, lastTurn: turn(SIDE.COMPUTER, { events: [TURN_EVENT.JJOK] }) });
    expect(rivalReaction(game, null).reaction).toBe(REACTION.QUIET);
  });
});

describe('대사', () => {
  it('반응마다 정해진 대사 중 하나를 고르고, 같은 판 상태에서는 늘 같은 대사다', () => {
    const game = over(SIDE.COMPUTER);
    const first = rivalReaction(game, null);
    expect(REACTION_LINES[REACTION.RIVAL_WON]).toContain(first.line);
    expect(rivalReaction(game, null).line).toBe(first.line);
  });

  it('대사는 모두 말풍선에 들어갈 14자 이하다', () => {
    const lines = Object.values(REACTION_LINES).flat();
    expect(lines.every((line) => line.length <= 14)).toBe(true);
  });
});
