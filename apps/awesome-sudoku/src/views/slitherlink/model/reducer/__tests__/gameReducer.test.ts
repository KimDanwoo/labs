import { EDGE } from '@views/slitherlink/config/board';
import { SLITHERLINK_LEVEL } from '@views/slitherlink/config/difficulty';
import { GAME_ACTION, GAME_PHASE, HINTS_PER_GAME } from '@views/slitherlink/config/game';
import { JUDGEMENT } from '@views/slitherlink/config/judgement';
import { createInitialState, gameReducer } from '@views/slitherlink/model/reducer/gameReducer';
import type { GameAction, GameState } from '@views/slitherlink/model/types/game';
import type { EdgeState, SlitherlinkPuzzle } from '@views/slitherlink/model/types/slitherlink';
import { describe, expect, it } from 'vitest';

const { UNKNOWN, LINE, CROSS } = EDGE;

const OUTER_LOOP_EDGES = [0, 1, 4, 5, 6, 8, 9, 11];
const INNER_EDGES = [2, 3, 7, 10];
const CELL_ZERO_LOOP = [0, 2, 6, 7];

const PUZZLE: SlitherlinkPuzzle = {
  size: 2,
  clues: [2, 2, 2, 2],
  solution: Array.from({ length: 12 }, (_, edge): EdgeState => (OUTER_LOOP_EDGES.includes(edge) ? LINE : CROSS)),
};

const run = (state: GameState, ...actions: GameAction[]): GameState => actions.reduce(gameReducer, state);

const playing = (): GameState =>
  run(createInitialState(SLITHERLINK_LEVEL.EASY), { type: GAME_ACTION.LOADED, requestId: 1, puzzle: PUZZLE });

const tap = (edge: number): GameAction => ({ type: GAME_ACTION.TAP_EDGE, edge });
const begin = (vertex: number): GameAction => ({ type: GAME_ACTION.STROKE_BEGIN, vertex });
const to = (vertex: number): GameAction => ({ type: GAME_ACTION.STROKE_TO, vertex });
const END: GameAction = { type: GAME_ACTION.STROKE_END };
const UNDO: GameAction = { type: GAME_ACTION.UNDO };
const REDO: GameAction = { type: GAME_ACTION.REDO };
const hint = (roll = 0): GameAction => ({ type: GAME_ACTION.HINT, roll });

const linesOf = (state: GameState): number[] => state.edges.flatMap((edge, index) => (edge === LINE ? [index] : []));

describe('게임 수명', () => {
  it('새 판을 요청하면 생성 중으로 바뀌고 요청 번호가 올라간다', () => {
    const state = run(playing(), { type: GAME_ACTION.GENERATE, level: SLITHERLINK_LEVEL.HARD });
    expect(state.phase).toBe(GAME_PHASE.GENERATING);
    expect(state.level).toBe(SLITHERLINK_LEVEL.HARD);
    expect(state.requestId).toBe(2);
  });

  it('늦게 도착한 이전 요청의 판은 버린다', () => {
    const generating = run(playing(), { type: GAME_ACTION.GENERATE, level: SLITHERLINK_LEVEL.EASY });
    const stale = run(generating, { type: GAME_ACTION.LOADED, requestId: 1, puzzle: PUZZLE });
    expect(stale).toBe(generating);
  });

  it('판이 오면 빈 변, 빈 기록, 힌트 3개로 시작한다', () => {
    const state = run(
      playing(),
      tap(0),
      hint(),
      { type: GAME_ACTION.GENERATE, level: SLITHERLINK_LEVEL.EASY },
      {
        type: GAME_ACTION.LOADED,
        requestId: 2,
        puzzle: PUZZLE,
      },
    );
    expect(state.phase).toBe(GAME_PHASE.PLAYING);
    expect(state.edges.every((edge) => edge === UNKNOWN)).toBe(true);
    expect(state.past).toHaveLength(0);
    expect(state.hintsRemaining).toBe(HINTS_PER_GAME);
  });

  it('생성 중에는 판 입력을 받지 않는다', () => {
    const generating = run(playing(), { type: GAME_ACTION.GENERATE, level: SLITHERLINK_LEVEL.EASY });
    expect(run(generating, tap(0))).toBe(generating);
  });
});

describe('변 탭', () => {
  it('빈칸 → 선 → X → 빈칸 순으로 바뀌고 탭마다 기록이 한 칸 쌓인다', () => {
    const once = run(playing(), tap(3));
    const twice = run(once, tap(3));
    const thrice = run(twice, tap(3));
    expect([once, twice, thrice].map((state) => state.edges[3])).toEqual([LINE, CROSS, UNKNOWN]);
    expect(thrice.past).toHaveLength(3);
  });
});

describe('드래그', () => {
  it('점에서 점으로 끌면 선을 긋고, 드래그 한 번이 기록 한 칸이다', () => {
    const state = run(playing(), begin(0), to(1), to(2), to(5), END);
    expect(linesOf(state)).toEqual([0, 1, 8]);
    expect(state.past).toHaveLength(1);
    expect(run(state, UNDO).edges.every((edge) => edge === UNKNOWN)).toBe(true);
  });

  it('빠르게 여러 점을 건너뛰어도 사이의 변을 모두 잇는다', () => {
    const state = run(playing(), begin(0), to(2), END);
    expect(linesOf(state)).toEqual([0, 1]);
  });

  it('X 위를 지나가면 선으로 바꾼다', () => {
    const state = run(playing(), tap(0), tap(0), begin(0), to(1), END);
    expect(state.edges[0]).toBe(LINE);
  });

  it('선 위에서 시작하면 지우기로 동작하고, 지우는 동안 새 선은 긋지 않는다', () => {
    const drawn = run(playing(), tap(0));
    const erased = run(drawn, begin(0), to(1), to(2), END);
    expect(erased.edges[0]).toBe(UNKNOWN);
    expect(erased.edges[1]).toBe(UNKNOWN);
    expect(erased.past).toHaveLength(2);
  });

  it('왔던 점으로 되돌아가면 방금 그은 변을 되돌린다', () => {
    const state = run(playing(), begin(0), to(1), to(2), to(1), END);
    expect(linesOf(state)).toEqual([0]);
  });

  it('제자리로 완전히 되돌아오면 기록을 남기지 않는다', () => {
    const state = run(playing(), begin(0), to(1), to(0), END);
    expect(linesOf(state)).toEqual([]);
    expect(state.past).toHaveLength(0);
  });

  it('드래그 중에 들어온 되돌리기·힌트·탭은 무시해 그리던 변이 기록에서 빠지지 않는다', () => {
    const drawing = run(playing(), tap(4), begin(0), to(2));
    expect(run(drawing, UNDO, hint(), tap(9))).toBe(drawing);
    const ended = run(drawing, END);
    expect(ended.past).toHaveLength(2);
    expect(linesOf(run(ended, UNDO))).toEqual([4]);
  });

  it('드래그가 취소되면 그리던 변을 모두 원래대로 돌린다', () => {
    const state = run(playing(), begin(0), to(2), { type: GAME_ACTION.STROKE_CANCEL });
    expect(linesOf(state)).toEqual([]);
    expect(state.stroke).toBeNull();
  });
});

describe('되돌리기·다시하기', () => {
  it('다시하기는 되돌린 변경을 복구하고, 새 입력은 다시하기 목록을 비운다', () => {
    const undone = run(playing(), tap(0), tap(1), UNDO);
    expect(linesOf(undone)).toEqual([0]);
    expect(linesOf(run(undone, REDO))).toEqual([0, 1]);
    expect(run(undone, tap(4)).future).toHaveLength(0);
  });

  it('기록이 없으면 아무 일도 하지 않는다', () => {
    const state = playing();
    expect(run(state, UNDO)).toBe(state);
    expect(run(state, REDO)).toBe(state);
  });
});

describe('힌트', () => {
  it('틀린 변을 먼저 정답으로 고치고 힌트 수를 줄인다', () => {
    const state = run(playing(), tap(2), hint());
    expect(state.edges[2]).toBe(CROSS);
    expect(state.lastHintEdge).toBe(2);
    expect(state.hintsRemaining).toBe(HINTS_PER_GAME - 1);
  });

  it('틀린 변이 없으면 아직 안 그은 정답 선을 긋는다', () => {
    const state = run(playing(), hint());
    expect(OUTER_LOOP_EDGES).toContain(state.lastHintEdge);
    expect(linesOf(state)).toEqual([state.lastHintEdge]);
  });

  it('되돌려도 쓴 힌트 수는 돌아오지 않는다', () => {
    const state = run(playing(), hint(), UNDO);
    expect(linesOf(state)).toEqual([]);
    expect(state.hintsRemaining).toBe(HINTS_PER_GAME - 1);
  });

  it('힌트를 다 쓰면 더 쓰지 못한다', () => {
    const spent = run({ ...playing(), hintsRemaining: 1 }, hint());
    expect(spent.hintsRemaining).toBe(0);
    expect(run(spent, hint())).toBe(spent);
  });

  it('다음 입력이 들어오면 힌트 강조를 지운다', () => {
    expect(run(playing(), hint(), tap(INNER_EDGES[0] ?? 0)).lastHintEdge).toBeNull();
  });
});

describe('판정', () => {
  it('잘못된 고리를 닫으면 WRONG_LOOP로 알리고 계속 진행한다', () => {
    const state = run(playing(), ...CELL_ZERO_LOOP.map(tap));
    expect(state.judgement).toBe(JUDGEMENT.WRONG_LOOP);
    expect(state.phase).toBe(GAME_PHASE.PLAYING);
  });

  it('드래그 중에는 판정하지 않고 손을 뗄 때 판정한다', () => {
    const drawing = run(playing(), begin(0), to(2), to(8), to(6), to(0));
    expect(drawing.phase).toBe(GAME_PHASE.PLAYING);
    expect(drawing.judgement).toBe(JUDGEMENT.DRAWING);
    expect(run(drawing, END).phase).toBe(GAME_PHASE.SOLVED);
  });

  it('X 표시는 판정에 영향을 주지 않는다', () => {
    const crossed = run(playing(), tap(2), tap(2));
    const solved = run(crossed, begin(0), to(2), to(8), to(6), to(0), END);
    expect(solved.judgement).toBe(JUDGEMENT.SOLVED);
  });

  it('풀린 뒤에는 탭·되돌리기·힌트를 받지 않는다', () => {
    const solved = run(playing(), begin(0), to(2), to(8), to(6), to(0), END);
    expect(run(solved, tap(2))).toBe(solved);
    expect(run(solved, UNDO)).toBe(solved);
    expect(run(solved, hint())).toBe(solved);
  });

  it('잘못된 고리에서 되돌리면 다시 그리는 중으로 돌아간다', () => {
    const state = run(playing(), ...CELL_ZERO_LOOP.map(tap), UNDO);
    expect(state.judgement).toBe(JUDGEMENT.DRAWING);
  });
});
