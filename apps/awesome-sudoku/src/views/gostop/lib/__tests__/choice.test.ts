import type { RandomInt } from '@shared/lib/random';
import { DECK_SIZE } from '@views/gostop/config/cards';
import { ANNOUNCE_COPY } from '@views/gostop/config/copy';
import { CHOICE_SOURCE, GAME_ACTION, PHASE, SIDE } from '@views/gostop/config/game';
import { MOTION, PLAYBACK_ACTION, STEP_KIND } from '@views/gostop/config/playback';
import { chooseCard, shouldGo } from '@views/gostop/lib/ai';
import { boardView } from '@views/gostop/lib/board';
import { choiceKindLabel, choicePickLabel, choicePoseStyle, choiceRoleOf } from '@views/gostop/lib/choice';
import { shuffleDealableDeck } from '@views/gostop/lib/deck';
import { moveChoiceFocus } from '@views/gostop/lib/focus';
import { collapseSteps, turnSteps } from '@views/gostop/lib/playback';
import { choiceStage, type TableStage } from '@views/gostop/lib/stage';
import { bestPicks, resolveTurn } from '@views/gostop/lib/turn';
import { INITIAL_PLAYBACK, isPlaybackRunning, playbackReducer } from '@views/gostop/model/reducer/playbackReducer';
import type { GameAction, GameState } from '@views/gostop/model/types/gostop';
import type { Motion, PlaybackState, PlaybackStep, StepKind } from '@views/gostop/model/types/playback';
import { describe, expect, it } from 'vitest';

const ALL_IDS = Array.from({ length: DECK_SIZE }, (_, id) => id);
const HAND_REST = 9;
const RIVAL_HAND = 10;

interface DeckPlan {
  played: number;
  floor: readonly number[];
  top: number;
}

function deckWith({ played, floor, top }: DeckPlan): number[] {
  const fixed = new Set([played, ...floor, top]);
  const rest = ALL_IDS.filter((id) => !fixed.has(id));
  const hand = [played, ...rest.slice(0, HAND_REST)];
  const rival = rest.slice(HAND_REST, HAND_REST + RIVAL_HAND);
  return [...hand, ...rival, ...floor, top, ...rest.slice(HAND_REST + RIVAL_HAND)];
}

const PLAYED_CHOICE: DeckPlan = { played: 8, floor: [9, 10, 12, 16, 20, 24, 28, 32], top: 36 };
const FLIPPED_CHOICE: DeckPlan = { played: 0, floor: [9, 10, 12, 16, 20, 24, 28, 32], top: 11 };
const DOUBLE_CHOICE: DeckPlan = { played: 8, floor: [9, 10, 13, 14, 20, 24, 28, 32], top: 15 };
const TTADAK: DeckPlan = { played: 8, floor: [9, 10, 12, 16, 20, 24, 28, 32], top: 11 };

const stageIds = ({ table, held, revealed }: TableStage): number[] => [
  ...table.hands.me,
  ...table.hands.computer,
  ...table.floor,
  ...table.deck,
  ...table.captured.me,
  ...table.captured.computer,
  ...(held === null ? [] : [held]),
  ...(revealed === null ? [] : [revealed]),
];

const expectFullDeck = (stage: TableStage) => {
  const ids = stageIds(stage);
  expect(ids).toHaveLength(DECK_SIZE);
  expect(new Set(ids).size).toBe(DECK_SIZE);
};

const apply = (state: PlaybackState, action: GameAction, motion: Motion = MOTION.FULL) =>
  playbackReducer(state, { type: PLAYBACK_ACTION.APPLY, action, motion });

const settle = (state: PlaybackState): PlaybackState => {
  let current = state;
  while (isPlaybackRunning(current))
    current = playbackReducer(current, { type: PLAYBACK_ACTION.ADVANCE, steps: current.steps });
  return current;
};

const dealt = (plan: DeckPlan, motion: Motion = MOTION.FULL) =>
  settle(apply(INITIAL_PLAYBACK, { type: GAME_ACTION.DEAL, deck: deckWith(plan) }, motion));

const kindsOf = (steps: readonly PlaybackStep[]): StepKind[] => steps.map((item) => item.kind);

const playMine = (state: PlaybackState, card: number, motion: Motion = MOTION.FULL) =>
  apply(state, { type: GAME_ACTION.PLAY, side: SIDE.ME, card }, motion);

const chooseMine = (state: PlaybackState, pick: number, motion: Motion = MOTION.FULL) =>
  apply(state, { type: GAME_ACTION.CHOOSE, side: SIDE.ME, pick }, motion);

const settledStage = (game: GameState): TableStage => {
  const { pending } = game;
  if (!pending) return { table: game.table, held: null, revealed: null };
  return choiceStage(game.table, game.turn, pending);
};

describe('선택 중 미리보기 판', () => {
  it('낸 패 선택이면 낸 패가 손에서 빠져 떠 있고, 바닥·더미는 그대로다', () => {
    const ready = dealt(PLAYED_CHOICE);
    const choosing = settle(playMine(ready, 8));
    const { pending, table } = choosing.game;
    expect(pending?.choice.source).toBe(CHOICE_SOURCE.PLAYED);
    if (!pending) return;
    const stage = choiceStage(table, SIDE.ME, pending);
    expect(stage.held).toBe(8);
    expect(stage.revealed).toBeNull();
    expect(stage.table.hands.me).not.toContain(8);
    expect(stage.table.floor).toEqual(table.floor);
    expect(stage.table.deck).toEqual(table.deck);
    expectFullDeck(stage);
  });

  it('뒤집은 패 선택이면 낸 패가 바닥에 놓이고 뒤집은 패가 앞면으로 떠 있다', () => {
    const choosing = settle(playMine(dealt(FLIPPED_CHOICE), 0));
    const { pending, table } = choosing.game;
    expect(pending?.choice.source).toBe(CHOICE_SOURCE.FLIPPED);
    if (!pending) return;
    const stage = choiceStage(table, SIDE.ME, pending);
    expect(stage.held).toBeNull();
    expect(stage.revealed).toBe(11);
    expect(stage.table.floor).toContain(0);
    expect(stage.table.deck).toEqual(table.deck.slice(1));
    expectFullDeck(stage);
  });

  it('멈춘 화면은 미리보기 판을 보여 주고, 내 후보와 입력 잠금을 함께 낸다', () => {
    const choosing = settle(playMine(dealt(PLAYED_CHOICE), 8));
    const view = boardView(choosing.game, null);
    expect(view.choice?.options).toEqual([9, 10]);
    expect(view.held).toBe(8);
    expect(view.isMyTurn).toBe(false);
    expect(view.activeSide).toBe(SIDE.ME);
    const stage = settledStage(choosing.game);
    expect(view.myHand).toEqual(stage.table.hands.me);
    expect(view.floor).toEqual(stage.table.floor);
    expect(view.deckCount).toBe(stage.table.deck.length);
    expectFullDeck(stage);
  });

  it('재생 중에는 후보를 내지 않는다', () => {
    const playing = playMine(dealt(PLAYED_CHOICE), 8);
    expect(boardView(playing.game, playing.steps[0] ?? null).choice).toBeNull();
  });
});

describe('선택 재생 단계', () => {
  it('낸 패 선택: 띄우기 → 알림, 고른 뒤에는 내기부터 끝까지 이어서 재생한다', () => {
    const playing = playMine(dealt(PLAYED_CHOICE), 8);
    expect(kindsOf(playing.steps)).toEqual([STEP_KIND.LIFT, STEP_KIND.ASK]);
    expect(playing.steps.at(-1)?.sound).toBe('choose');
    const resolved = chooseMine(settle(playing), 10);
    expect(resolved.game.lastTurn?.taken).toEqual([8, 10]);
    expect(kindsOf(resolved.steps)).toEqual([
      STEP_KIND.PLAY,
      STEP_KIND.REVEAL,
      STEP_KIND.LAND,
      STEP_KIND.GATHER,
      STEP_KIND.CAPTURE,
    ]);
    expect(resolved.steps.at(-1)?.table).toBe(resolved.game.table);
  });

  it('뒤집은 패 선택: 내기 → 뒤집기 → 알림, 고른 뒤에는 놓기부터 재생해 뒤집기를 되풀이하지 않는다', () => {
    const playing = playMine(dealt(FLIPPED_CHOICE), 0);
    expect(kindsOf(playing.steps)).toEqual([STEP_KIND.PLAY, STEP_KIND.REVEAL, STEP_KIND.ASK]);
    const resolved = chooseMine(settle(playing), 9);
    expect(resolved.steps[0]?.kind).toBe(STEP_KIND.LAND);
    expect(kindsOf(resolved.steps)).not.toContain(STEP_KIND.PLAY);
    expect(kindsOf(resolved.steps)).not.toContain(STEP_KIND.REVEAL);
    expect(resolved.steps.at(-1)?.table).toBe(resolved.game.table);
  });

  it('두 번 고르면 내기·뒤집기가 한 번씩만 나오고, 이어 붙이면 보통 차례와 같은 순서다', () => {
    const ready = dealt(DOUBLE_CHOICE);
    const first = playMine(ready, 8);
    const second = chooseMine(settle(first), 9);
    expect(second.game.pending?.choice.source).toBe(CHOICE_SOURCE.FLIPPED);
    const resolved = chooseMine(settle(second), 14);
    const shown = [...first.steps, ...second.steps, ...resolved.steps].filter(
      (item) => item.kind !== STEP_KIND.LIFT && item.kind !== STEP_KIND.ASK,
    );
    const { report, table } = resolveTurn(ready.game.table, SIDE.ME, 8, [9, 14]);
    expect(kindsOf(shown)).toEqual(kindsOf(turnSteps(ready.game.table, report, table)));
    expect(kindsOf(shown).filter((kind) => kind === STEP_KIND.PLAY)).toHaveLength(1);
    expect(kindsOf(shown).filter((kind) => kind === STEP_KIND.REVEAL)).toHaveLength(1);
    expect(resolved.game.table).toEqual(table);
  });

  it('모든 선택 단계와 멈춘 화면에서 48장이 중복·누락 없이 있다', () => {
    [PLAYED_CHOICE, FLIPPED_CHOICE, DOUBLE_CHOICE].forEach((plan) => {
      let state = playMine(dealt(plan), plan.played);
      while (state.game.phase === PHASE.CHOOSE) {
        state.steps.forEach(expectFullDeck);
        state = settle(state);
        expectFullDeck(settledStage(state.game));
        const pick = state.game.pending?.choice.options[0] ?? 0;
        state = chooseMine(state, pick);
      }
      state.steps.forEach(expectFullDeck);
    });
  });

  it('따닥처럼 뒤집은 패가 같은 달이면 선택 없이 바로 재생한다', () => {
    const played = playMine(dealt(TTADAK), 8);
    expect(played.game.phase).not.toBe(PHASE.CHOOSE);
    expect(played.steps[0]?.kind).toBe(STEP_KIND.PLAY);
  });

  it('reduced-motion이면 선택 앞부분이 한 단계로 접히고, 떠 있는 패와 알림음은 남는다', () => {
    const flipped = playMine(dealt(FLIPPED_CHOICE, MOTION.REDUCED), 0, MOTION.REDUCED);
    expect(flipped.steps).toHaveLength(1);
    expect(flipped.steps[0]?.revealed).toBe(11);
    expect(flipped.steps[0]?.sound).toBe('choose');
    const lifted = collapseSteps(playMine(dealt(PLAYED_CHOICE), 8).steps);
    expect(lifted[0]?.held).toBe(8);
  });

  it('선택을 물을 때마다 안내 문장을 한 번 만든다', () => {
    const first = playMine(dealt(DOUBLE_CHOICE), 8);
    expect(first.announcement).toBe(ANNOUNCE_COPY.choosing);
    const second = chooseMine(settle(first), 9);
    expect(second.announcement).toBe(ANNOUNCE_COPY.choosing);
    expect(isPlaybackRunning(second)).toBe(true);
  });

  it('고르는 중에 새 판을 돌리면 선택이 사라진다', () => {
    const choosing = settle(playMine(dealt(PLAYED_CHOICE), 8));
    const restarted = settle(apply(choosing, { type: GAME_ACTION.DEAL, deck: deckWith(TTADAK) }));
    expect(restarted.game.pending).toBeNull();
    expect(boardView(restarted.game, null).choice).toBeNull();
  });
});

const seeded = (seed: number): RandomInt => {
  let value = seed;
  return (bound) => {
    value = (value * 1103515245 + 12345) % 2 ** 31;
    return value % bound;
  };
};

function nextMove(game: GameState, random: RandomInt): GameAction {
  const side = game.turn;
  const pick = game.pending?.choice.options.at(-1);
  if (pick !== undefined) return { type: GAME_ACTION.CHOOSE, side, pick };
  if (game.phase === PHASE.DECIDE) return { type: shouldGo(game, side) ? GAME_ACTION.GO : GAME_ACTION.STOP, side };
  const card = chooseCard(game.table, side, random);
  const picks = side === SIDE.COMPUTER ? bestPicks(game.table, card) : [];
  return { type: GAME_ACTION.PLAY, side, card, picks };
}

const SEEDS = Array.from({ length: 40 }, (_, index) => index * 7919 + 5);
const MAX_ACTIONS = 200;

describe('직접 고르며 한 판 끝까지', () => {
  it('선택이 섞인 판도 모든 단계에서 48장이고, 차례가 끝나면 마지막 단계가 리듀서 판과 같다', () => {
    let choiceCount = 0;
    SEEDS.forEach((seed) => {
      const random = seeded(seed);
      let state = settle(apply(INITIAL_PLAYBACK, { type: GAME_ACTION.DEAL, deck: shuffleDealableDeck(random) }));
      let actions = 0;
      const isRunning = () => state.game.phase !== PHASE.OVER;
      while (isRunning()) {
        expect(actions).toBeLessThan(MAX_ACTIONS);
        const next = apply(state, nextMove(state.game, random));
        next.steps.forEach(expectFullDeck);
        const isChoosing = next.game.phase === PHASE.CHOOSE;
        if (isChoosing) choiceCount += 1;
        if (!isChoosing) expect(next.steps.at(-1)?.table).toBe(next.game.table);
        state = settle(next);
        actions += 1;
      }
      expect(state.game.phase).toBe(PHASE.OVER);
    });
    expect(choiceCount).toBeGreaterThan(0);
  });
});

describe('후보 표시', () => {
  it('후보마다 종류를 짧게, 접근 이름은 달·종류와 먹기로 읽힌다', () => {
    expect(choiceKindLabel(9)).toBe('띠');
    expect(choiceKindLabel(10)).toBe('피');
    expect(choiceKindLabel(0)).toBe('광');
    expect(choiceKindLabel(41)).toBe('쌍피');
    expect(choicePickLabel(9)).toBe('3월 홍단 띠 먹기');
  });

  it('후보만 강조하고 나머지 바닥 패는 흐린다', () => {
    const choice = { source: CHOICE_SOURCE.PLAYED, card: 8, options: [9, 10] };
    expect(choiceRoleOf(choice, 9)).toBe('candidate');
    expect(choiceRoleOf(choice, 12)).toBe('dimmed');
    expect(choiceRoleOf(null, 9)).toBe('none');
  });

  it('가장자리 달은 안쪽으로, 가운데 달은 양옆으로 벌려 두 후보가 겹치지 않는다', () => {
    expect(choicePoseStyle(0, 0).translate).toContain('* 0)');
    expect(choicePoseStyle(1, 1).translate).toContain('* 1.1)');
    expect(choicePoseStyle(20, 0).translate).toContain('* -1.1)');
    expect(choicePoseStyle(4, 0).translate).toContain('* -0.55)');
  });
});

function choiceList(): HTMLButtonElement[] {
  const list = document.createElement('ul');
  const item = document.createElement('li');
  const picks = [0, 1].map(() => {
    const button = document.createElement('button');
    button.dataset.choicePick = '';
    item.append(button);
    return button;
  });
  list.append(item);
  document.body.append(list);
  return picks;
}

const keyOn = (target: HTMLElement, key: string) => {
  let isPrevented = false;
  moveChoiceFocus({ key, currentTarget: target, preventDefault: () => (isPrevented = true) });
  return isPrevented;
};

describe('후보 키보드 이동', () => {
  it('화살표는 다른 후보로 포커스를 옮기고, 다른 키는 그대로 둔다', () => {
    const [first, second] = choiceList();
    if (!first) return;
    if (!second) return;
    first.focus();
    expect(keyOn(first, 'ArrowRight')).toBe(true);
    expect(document.activeElement).toBe(second);
    expect(keyOn(second, 'ArrowUp')).toBe(true);
    expect(document.activeElement).toBe(first);
    expect(keyOn(first, 'Enter')).toBe(false);
    expect(document.activeElement).toBe(first);
  });
});
