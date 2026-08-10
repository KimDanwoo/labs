import { FIXED_PUZZLE_6 as PUZZLE } from '@entities/stardoku/model/__tests__/fixtures';
import { CELL_MARK, DRAG_THRESHOLD_PX, MAX_HINTS, MAX_LIVES } from '@entities/stardoku/model/constants';
import { createEmptyMarks, markAt, withMark } from '@entities/stardoku/model/utils';
import { hintsRemainingAtom, livesAtom, marksAtom, puzzleAtom, stageAtom } from '@features/stardoku-game/model/atoms';
import { useBoardGestures } from '@features/stardoku-game/model/hooks';
import { act, fireEvent, render } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

const CELL_PX = 40;

/** 셀을 40px 격자로 배치하고 elementFromPoint가 좌표→셀을 풀도록 세운다 */
const Board = () => {
  const { handlePointerDown, handlePointerMove, handlePointerUp } = useBoardGestures();
  return (
    <div
      data-testid="grid"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {Array.from({ length: PUZZLE.size }, (_, row) =>
        Array.from({ length: PUZZLE.size }, (_, col) => (
          <button key={`${row}-${col}`} type="button" data-stardoku-cell data-row={row} data-col={col} />
        )),
      )}
    </div>
  );
};

const setup = () => {
  const store = createStore();
  store.set(puzzleAtom, PUZZLE);
  store.set(marksAtom, createEmptyMarks(PUZZLE.size));
  store.set(livesAtom, MAX_LIVES);
  store.set(hintsRemainingAtom, MAX_HINTS);
  store.set(stageAtom, 1);

  const utils = render(
    <Provider store={store}>
      <Board />
    </Provider>,
  );
  const grid = utils.getByTestId('grid');

  // jsdom에 elementFromPoint가 없다 — 40px 격자로 좌표→셀을 직접 푼다
  document.elementFromPoint = (x: number, y: number) =>
    grid.querySelector(`[data-row="${Math.floor(y / CELL_PX)}"][data-col="${Math.floor(x / CELL_PX)}"]`);

  const at = (row: number, col: number) => ({
    clientX: col * CELL_PX + CELL_PX / 2,
    clientY: row * CELL_PX + CELL_PX / 2,
  });

  const fire = (type: 'pointerdown' | 'pointermove' | 'pointerup', coords: { clientX: number; clientY: number }) => {
    act(() => {
      fireEvent(grid, new PointerEvent(type, { bubbles: true, pointerId: 1, ...coords }));
    });
  };

  return { store, at, fire, marks: () => store.get(marksAtom) };
};

describe('useBoardGestures — 모바일 드래그', () => {
  it('임계값 미만으로 흔들려도 탭으로 남아 연속 탭 ⭐ 승격이 된다 (33px 셀에서 손가락이 굴러도 조작이 깨지지 않는다)', () => {
    const { at, fire, marks } = setup();
    const origin = at(2, 2);
    const jittered = { clientX: origin.clientX + DRAG_THRESHOLD_PX - 2, clientY: origin.clientY };

    // 1타 — 살짝 흔들린 탭
    fire('pointerdown', origin);
    fire('pointermove', jittered);
    fire('pointerup', jittered);
    expect(markAt(marks(), 2, 2)).toBe(CELL_MARK.X);

    // 2타 — 드래그로 오인됐다면 ✕ 승격 자격(lastXTap)이 없어 별이 놓이지 않는다
    fire('pointerdown', origin);
    fire('pointerup', origin);

    expect(markAt(marks(), 2, 2)).toBe(CELL_MARK.STAR);
    expect(markAt(marks(), 2, 3)).toBe(CELL_MARK.EMPTY);
  });

  it('임계값을 넘겨 빈칸에서 끌면 지나간 칸에 ✕를 칠한다', () => {
    const { at, fire, marks } = setup();

    fire('pointerdown', at(0, 0));
    fire('pointermove', at(0, 1));
    fire('pointermove', at(0, 2));
    fire('pointerup', at(0, 2));

    expect(markAt(marks(), 0, 0)).toBe(CELL_MARK.X);
    expect(markAt(marks(), 0, 1)).toBe(CELL_MARK.X);
    expect(markAt(marks(), 0, 2)).toBe(CELL_MARK.X);
  });

  it('✕에서 시작한 드래그는 지운다', () => {
    const { store, at, fire, marks } = setup();
    let next = store.get(marksAtom);
    for (const col of [0, 1, 2]) next = withMark(next, 3, col, CELL_MARK.X);
    act(() => store.set(marksAtom, next));

    fire('pointerdown', at(3, 0));
    fire('pointermove', at(3, 1));
    fire('pointermove', at(3, 2));
    fire('pointerup', at(3, 2));

    expect(markAt(marks(), 3, 0)).toBe(CELL_MARK.EMPTY);
    expect(markAt(marks(), 3, 1)).toBe(CELL_MARK.EMPTY);
    expect(markAt(marks(), 3, 2)).toBe(CELL_MARK.EMPTY);
  });

  it('별에서 시작한 드래그는 아무것도 건드리지 않는다 — 애써 놓은 별이 쓸려나가면 안 된다', () => {
    const { store, at, fire, marks } = setup();
    act(() => store.set(marksAtom, withMark(store.get(marksAtom), 4, 0, CELL_MARK.STAR)));

    fire('pointerdown', at(4, 0));
    fire('pointermove', at(4, 1));
    fire('pointermove', at(4, 2));
    fire('pointerup', at(4, 2));

    expect(markAt(marks(), 4, 0)).toBe(CELL_MARK.STAR);
    expect(markAt(marks(), 4, 1)).toBe(CELL_MARK.EMPTY);
    expect(markAt(marks(), 4, 2)).toBe(CELL_MARK.EMPTY);
  });
});
