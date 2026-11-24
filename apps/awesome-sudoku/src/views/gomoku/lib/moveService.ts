import { MAX_DEPTH, UI_THINK_MS } from '@views/gomoku/config/ai';
import type { MoveRequest, MoveResponse } from '@views/gomoku/lib/gomoku.worker';
import { chooseMove } from '@views/gomoku/lib/search';
import type { Stone } from '@views/gomoku/model/types/gomoku';

interface Pending {
  resolve: (cell: number) => void;
  reject: (error: Error) => void;
}

let worker: Worker | null | undefined;
const pending = new Map<number, Pending>();
let nextRequestId = 1;

const settleResponse = (response: MoveResponse): void => {
  const settle = pending.get(response.id);
  if (!settle) return;
  pending.delete(response.id);
  if ('error' in response) settle.reject(new Error(response.error));
  else settle.resolve(response.cell);
};

const createWorker = (): Worker | null => {
  try {
    const created = new Worker(new URL('./gomoku.worker.ts', import.meta.url), { type: 'module' });
    created.onmessage = (event: MessageEvent<MoveResponse>) => settleResponse(event.data);
    created.onerror = () => {
      worker = null;
      pending.forEach(({ reject }) => reject(new Error('오목 워커가 종료됐어요')));
      pending.clear();
    };
    return created;
  } catch {
    return null;
  }
};

const getWorker = (): Worker | null => {
  if (worker === undefined) worker = typeof Worker === 'undefined' ? null : createWorker();
  return worker;
};

const thinkInPlace = (cells: readonly number[], stone: Stone): Promise<number> =>
  new Promise((resolve) => resolve(chooseMove(cells, stone, { maxDepth: MAX_DEPTH, budgetMs: UI_THINK_MS })));

export const requestMove = (cells: readonly number[], stone: Stone): Promise<number> => {
  const active = getWorker();
  if (!active) return thinkInPlace(cells, stone);

  const id = nextRequestId;
  nextRequestId += 1;
  return new Promise<number>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    active.postMessage({ id, cells, stone } satisfies MoveRequest);
  }).catch(() => thinkInPlace(cells, stone));
};
