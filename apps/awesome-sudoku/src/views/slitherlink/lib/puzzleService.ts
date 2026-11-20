import { generateSlitherlink } from '@views/slitherlink/lib/puzzleGenerator';
import type { SlitherlinkRequest, SlitherlinkResponse } from '@views/slitherlink/lib/slitherlink.worker';
import type { SlitherlinkLevel, SlitherlinkPuzzle } from '@views/slitherlink/model/types/slitherlink';

interface Pending {
  resolve: (puzzle: SlitherlinkPuzzle) => void;
  reject: (error: Error) => void;
}

let worker: Worker | null | undefined;
const pending = new Map<number, Pending>();
const prefetched = new Map<SlitherlinkLevel, Promise<SlitherlinkPuzzle>>();
let nextRequestId = 1;

const failAllPending = (message: string): void => {
  pending.forEach(({ reject }) => reject(new Error(message)));
  pending.clear();
};

const settleResponse = (response: SlitherlinkResponse): void => {
  const settle = pending.get(response.id);
  if (!settle) return;
  pending.delete(response.id);
  if ('error' in response) settle.reject(new Error(response.error));
  else settle.resolve(response.puzzle);
};

const createWorker = (): Worker | null => {
  try {
    const created = new Worker(new URL('./slitherlink.worker.ts', import.meta.url), { type: 'module' });
    created.onmessage = (event: MessageEvent<SlitherlinkResponse>) => settleResponse(event.data);
    created.onerror = () => {
      worker = null;
      failAllPending('슬리더링크 워커가 종료됐어요');
    };
    return created;
  } catch {
    return null;
  }
};

const getWorker = (): Worker | null => {
  if (worker !== undefined) return worker;
  const isWorkerUnavailable = typeof window === 'undefined' || typeof Worker === 'undefined';
  worker = isWorkerUnavailable ? null : createWorker();
  return worker;
};

const generateInPlace = (level: SlitherlinkLevel): Promise<SlitherlinkPuzzle> =>
  new Promise((resolve) => resolve(generateSlitherlink(level)));

const generate = (level: SlitherlinkLevel): Promise<SlitherlinkPuzzle> => {
  const active = getWorker();
  if (!active) return generateInPlace(level);

  const id = nextRequestId;
  nextRequestId += 1;
  return new Promise<SlitherlinkPuzzle>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    active.postMessage({ id, level } satisfies SlitherlinkRequest);
  }).catch(() => generateInPlace(level));
};

export const prefetchPuzzle = (level: SlitherlinkLevel): void => {
  if (prefetched.has(level)) return;
  prefetched.set(level, generate(level));
};

export const requestPuzzle = async (level: SlitherlinkLevel): Promise<SlitherlinkPuzzle> => {
  const ready = prefetched.get(level) ?? generate(level);
  prefetched.delete(level);
  const puzzle = await ready;
  setTimeout(() => prefetchPuzzle(level));
  return puzzle;
};
