import { SudokuCell } from "@entities/board/model/types";
import { HistoryEntry } from "@features/undo-redo/model/types";
import { atom } from "jotai";

const MAX_HISTORY_SIZE = 50;

/** undo 스택 */
export const pastAtom = atom<HistoryEntry[]>([]);

/** redo 스택 */
export const futureAtom = atom<HistoryEntry[]>([]);

/** undo 가능 여부 (derived) */
export const canUndoAtom = atom((get) => get(pastAtom).length > 0);

/** redo 가능 여부 (derived) */
export const canRedoAtom = atom((get) => get(futureAtom).length > 0);

/**
 * 보드 스냅샷을 히스토리에 추가한다.
 * 보드 상태는 불변(immutable)이므로 참조를 직접 저장해도 안전하다.
 */
export const pushStateAtom = atom(
  null,
  (get, set, board: SudokuCell[][]) => {
    const past = get(pastAtom);
    const entry: HistoryEntry = { board, timestamp: Date.now() };
    const newPast = [...past, entry];
    if (newPast.length > MAX_HISTORY_SIZE) newPast.shift();
    set(pastAtom, newPast);
    set(futureAtom, []);
  },
);

/** undo — 이전 보드를 반환하고 past에서 제거 */
export const undoAtom = atom(
  null,
  (get, set) => {
    const past = get(pastAtom);
    if (past.length === 0) return null;
    const newPast = [...past];
    const entry = newPast.pop()!;
    set(pastAtom, newPast);
    return entry.board;
  },
);

/** redo — 다음 보드를 반환하고 future에서 제거 */
export const redoAtom = atom(
  null,
  (get, set) => {
    const future = get(futureAtom);
    if (future.length === 0) return null;
    const newFuture = [...future];
    const entry = newFuture.shift()!;
    set(futureAtom, newFuture);
    return entry.board;
  },
);

/** 히스토리 초기화 */
export const clearHistoryAtom = atom(
  null,
  (_get, set) => {
    set(pastAtom, []);
    set(futureAtom, []);
  },
);
