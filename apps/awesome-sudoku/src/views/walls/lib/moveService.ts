import { chooseMove } from '@views/walls/lib/search';
import type { MoveRequest, MoveResponse } from '@views/walls/lib/walls.worker';
import type { Move, Side } from '@views/walls/model/types/walls';

interface Pending {
  resolve: (move: Move | null) => void;
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
  else settle.resolve(response.move);
};

const createWorker = (): Worker | null => {
  try {
    const created = new Worker(new URL('./walls.worker.ts', import.meta.url), { type: 'module' });
    created.onmessage = (event: MessageEvent<MoveResponse>) => settleResponse(event.data);
    created.onerror = () => {
      worker = null;
      pending.forEach(({ reject }) => reject(new Error('담쌓기 워커가 종료됐어요')));
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

const thinkInPlace = (moves: readonly Move[], side: Side): Promise<Move | null> =>
  new Promise((resolve) => resolve(chooseMove(moves, side)));

export const requestMove = (moves: readonly Move[], side: Side): Promise<Move | null> => {
  const active = getWorker();
  if (!active) return thinkInPlace(moves, side);

  const id = nextRequestId;
  nextRequestId += 1;
  return new Promise<Move | null>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    active.postMessage({ id, moves, side } satisfies MoveRequest);
  }).catch(() => thinkInPlace(moves, side));
};
