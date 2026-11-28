import type { RandomInt } from '@shared/lib/random';
import { DECK_SIZE } from '@views/gostop/config/cards';
import { GAME_ACTION, PHASE, SIDE, TURN_EVENT } from '@views/gostop/config/game';
import { MOTION, PLAYBACK_ACTION, SPEED_FACTOR, STEP_KIND } from '@views/gostop/config/playback';
import { chooseCard, shouldGo } from '@views/gostop/lib/ai';
import { shuffleDealableDeck } from '@views/gostop/lib/deck';
import { collapseSteps, totalDuration, transitionSteps, turnSteps } from '@views/gostop/lib/playback';
import { bestPicks, resolveTurn } from '@views/gostop/lib/turn';
import { gameReducer, INITIAL_STATE } from '@views/gostop/model/reducer/gameReducer';
import { INITIAL_PLAYBACK, isPlaybackRunning, playbackReducer } from '@views/gostop/model/reducer/playbackReducer';
import type { GameAction, GameState, Table } from '@views/gostop/model/types/gostop';
import type { Motion, PlaybackState, PlaybackStep } from '@views/gostop/model/types/playback';
import { describe, expect, it } from 'vitest';

const seeded = (seed: number): RandomInt => {
  let value = seed;
  return (bound) => {
    value = (value * 1103515245 + 12345) % 2 ** 31;
    return value % bound;
  };
};

const cardCount = (step: PlaybackStep): number => {
  const { hands, floor, deck, captured } = step.table;
  const revealed = step.revealed === null ? 0 : 1;
  return (
    hands.me.length +
    hands.computer.length +
    floor.length +
    deck.length +
    captured.me.length +
    captured.computer.length +
    revealed
  );
};

const allIds = (table: Table, revealed: number | null): number[] => [
  ...table.hands.me,
  ...table.hands.computer,
  ...table.floor,
  ...table.deck,
  ...table.captured.me,
  ...table.captured.computer,
  ...(revealed === null ? [] : [revealed]),
];

const apply = (state: PlaybackState, action: GameAction, motion: Motion = MOTION.FULL, gameId?: string) =>
  playbackReducer(state, { type: PLAYBACK_ACTION.APPLY, action, motion, gameId });

const settle = (state: PlaybackState): PlaybackState => {
  let current = state;
  while (isPlaybackRunning(current))
    current = playbackReducer(current, { type: PLAYBACK_ACTION.ADVANCE, steps: current.steps });
  return current;
};

const nextAction = (game: GameState, random: RandomInt): GameAction => {
  const side = game.turn;
  if (game.phase === PHASE.DECIDE) return { type: shouldGo(game, side) ? GAME_ACTION.GO : GAME_ACTION.STOP, side };
  const card = chooseCard(game.table, side, random);
  return { type: GAME_ACTION.PLAY, side, card, picks: bestPicks(game.table, card) };
};

function playWholeGame(
  seed: number,
  motion: Motion,
  onSteps: (steps: readonly PlaybackStep[], game: GameState) => void,
) {
  const random = seeded(seed);
  let state = settle(apply(INITIAL_PLAYBACK, { type: GAME_ACTION.DEAL, deck: shuffleDealableDeck(random) }, motion));
  while (state.game.phase !== PHASE.OVER) {
    const next = apply(state, nextAction(state.game, random), motion);
    onSteps(next.steps, next.game);
    state = settle(next);
  }
  return state;
}

const SEEDS = Array.from({ length: 40 }, (_, index) => index * 7919 + 1);

describe('재생 단계 불변식', () => {
  it('한 판을 끝까지 재생해도 모든 단계에서 48장이 중복·누락 없이 있고, 마지막 단계는 리듀서 판과 같다', () => {
    SEEDS.forEach((seed) => {
      playWholeGame(seed, MOTION.FULL, (steps, game) => {
        steps.forEach((step) => {
          const ids = allIds(step.table, step.revealed);
          expect(cardCount(step)).toBe(DECK_SIZE);
          expect(new Set(ids).size).toBe(DECK_SIZE);
        });
        expect(steps.at(-1)?.table).toBe(game.table);
      });
    });
  });

  it('한 차례는 보통 1.2~2.0초, 빠름은 그 절반 이하로 재생된다', () => {
    SEEDS.forEach((seed) => {
      playWholeGame(seed, MOTION.FULL, (steps) => {
        const turn = steps.filter((step) => step.kind !== STEP_KIND.RESULT && step.kind !== STEP_KIND.CALL);
        if (turn.length === 0) return;
        const total = totalDuration(turn);
        expect(total).toBeGreaterThanOrEqual(1200);
        expect(total).toBeLessThanOrEqual(2000);
        expect(total * SPEED_FACTOR.fast).toBeLessThanOrEqual(total / 2);
      });
    });
  });

  it('reduced-motion이면 차례마다 한 단계로 접혀 바로 결과 판이 된다', () => {
    SEEDS.slice(0, 10).forEach((seed) => {
      const final = playWholeGame(seed, MOTION.REDUCED, (steps, game) => {
        expect(steps).toHaveLength(1);
        expect(steps[0]?.table).toBe(game.table);
        expect(steps[0]?.revealed).toBeNull();
      });
      expect(final.game.result).not.toBeNull();
    });
  });
});

describe('차례 단계 순서', () => {
  const table: Table = {
    hands: { [SIDE.ME]: [0, 20], [SIDE.COMPUTER]: [44] },
    floor: [1, 8, 40],
    deck: [9, 30],
    captured: { [SIDE.ME]: [], [SIDE.COMPUTER]: [3] },
  };

  it('내기 → 뒤집기 → 놓기 → 모으기 → 먹기 순으로 재생한다', () => {
    const { table: next, report } = resolveTurn(table, SIDE.ME, 0);
    const steps = turnSteps(table, report, next);
    expect(steps.map((step) => step.kind)).toEqual([
      STEP_KIND.PLAY,
      STEP_KIND.REVEAL,
      STEP_KIND.LAND,
      STEP_KIND.GATHER,
      STEP_KIND.CAPTURE,
    ]);
    expect(steps[0]?.table.floor).toEqual([1, 8, 40, 0]);
    expect(steps[1]?.revealed).toBe(9);
    expect(steps[3]?.gathering).toEqual(report.taken);
  });

  it('쪽이면 모으기 단계에 컷인을 달고, 뺏은 피는 마지막 단계에서 넘어온다', () => {
    const jjokTable: Table = { ...table, floor: [8], deck: [1, 30] };
    const { table: next, report } = resolveTurn(jjokTable, SIDE.ME, 0);
    expect(report.events).toContain(TURN_EVENT.JJOK);
    const steps = turnSteps(jjokTable, report, next);
    const gather = steps.find((step) => step.kind === STEP_KIND.GATHER);
    expect(gather?.cutIn).toEqual({ label: '쪽!', tone: 'mine', power: 1 });
    expect(steps.at(-1)?.kind).toBe(STEP_KIND.STEAL);
    expect(steps.at(-1)?.table.captured.me).toContain(3);
  });

  it('뻑처럼 먹은 패가 없으면 놓기 단계에 컷인을 단다', () => {
    const ppukTable: Table = { ...table, floor: [2, 8], deck: [1, 30] };
    const { table: next, report } = resolveTurn(ppukTable, SIDE.ME, 0);
    expect(report.events).toEqual([TURN_EVENT.PPUK]);
    const steps = turnSteps(ppukTable, report, next);
    expect(steps.at(-1)?.kind).toBe(STEP_KIND.LAND);
    expect(steps.at(-1)?.cutIn?.label).toBe('뻑!');
  });

  it('고와 스톱은 액션 종류로 컷인 단계를 만든다', () => {
    const deciding: GameState = {
      ...INITIAL_STATE,
      phase: PHASE.DECIDE,
      turn: SIDE.COMPUTER,
      table: { ...table, hands: { [SIDE.ME]: [20], [SIDE.COMPUTER]: [44] } },
    };
    const goAction: GameAction = { type: GAME_ACTION.GO, side: SIDE.COMPUTER };
    const goSteps = transitionSteps(deciding, gameReducer(deciding, goAction), goAction);
    expect(goSteps.map((step) => step.cutIn?.label)).toEqual(['1고!']);
    expect(goSteps[0]?.cutIn?.tone).toBe('rival');
    const thirdGo: GameState = { ...deciding, goCount: { [SIDE.ME]: 0, [SIDE.COMPUTER]: 2 } };
    const thirdSteps = transitionSteps(thirdGo, gameReducer(thirdGo, goAction), goAction);
    expect(thirdSteps[0]?.cutIn?.power).toBeGreaterThan(goSteps[0]?.cutIn?.power ?? 0);
    const stopAction: GameAction = { type: GAME_ACTION.STOP, side: SIDE.COMPUTER };
    const stopSteps = transitionSteps(deciding, gameReducer(deciding, stopAction), stopAction);
    expect(stopSteps.map((step) => step.kind)).toEqual([STEP_KIND.CALL, STEP_KIND.RESULT]);
    expect(stopSteps[1]?.sound).toBe('lose');
  });

  it('여러 단계를 접으면 컷인 글자를 합치고 결과 소리를 남긴다', () => {
    const jjokTable: Table = { ...table, floor: [], deck: [1, 30] };
    const { table: next, report } = resolveTurn(jjokTable, SIDE.ME, 0);
    const turn = turnSteps(jjokTable, report, next);
    const result = turn.slice(-1).map((step) => ({ ...step, kind: STEP_KIND.RESULT, sound: 'win' as const }));
    const steps = collapseSteps([...turn, ...result]);
    expect(steps).toHaveLength(1);
    expect(steps[0]?.cutIn?.label).toBe('쪽! 싹쓸이!');
    expect(steps[0]?.cutIn?.power).toBe(2);
    expect(steps[0]?.sound).toBe('win');
    expect(steps[0]?.table).toBe(next);
  });
});

describe('재생 리듀서', () => {
  const dealt = (motion: Motion = MOTION.FULL) =>
    apply(INITIAL_PLAYBACK, { type: GAME_ACTION.DEAL, deck: shuffleDealableDeck(seeded(3)) }, motion, 'game-1');

  it('재생 중에는 내 패를 받지 않는다', () => {
    const state = dealt();
    const card = state.game.table.hands.me[0] ?? 0;
    expect(isPlaybackRunning(state)).toBe(true);
    expect(apply(state, { type: GAME_ACTION.PLAY, side: SIDE.ME, card })).toBe(state);
    const ready = settle(state);
    expect(apply(ready, { type: GAME_ACTION.PLAY, side: SIDE.ME, card })).not.toBe(ready);
  });

  it('재생 중 새 판을 누르면 큐를 갈아끼우고 옛 단계의 진행 신호는 무시한다', () => {
    const ready = settle(dealt());
    const playing = apply(ready, { type: GAME_ACTION.PLAY, side: SIDE.ME, card: ready.game.table.hands.me[0] ?? 0 });
    const oldSteps = playing.steps;
    const restarted = apply(
      playing,
      { type: GAME_ACTION.DEAL, deck: shuffleDealableDeck(seeded(9)) },
      MOTION.FULL,
      'game-2',
    );
    expect(restarted.gameId).toBe('game-2');
    expect(restarted.cursor).toBe(0);
    expect(playbackReducer(restarted, { type: PLAYBACK_ACTION.ADVANCE, steps: oldSteps })).toBe(restarted);
  });

  it('차례마다 안내 문장을 한 번 만든다', () => {
    const ready = settle(dealt());
    expect(ready.announcement).toContain('패를 돌렸어요');
    const card = ready.game.table.hands.me[0] ?? 0;
    const played = apply(ready, { type: GAME_ACTION.PLAY, side: SIDE.ME, card });
    expect(played.announcement).toMatch(/^내가 \d+월 .+ 냄\./);
  });
});
