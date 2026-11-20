import type { PuzzleRequest, PuzzleResponse } from '@entities/sudoku/lib/puzzle.worker';
import { generatePuzzle, type GeneratedPuzzle } from '@entities/sudoku/lib/puzzleGenerator';
import type { Difficulty, GameMode } from '@entities/sudoku/model/types/game';

type Pending = {
  resolve: (puzzle: GeneratedPuzzle) => void;
  reject: (error: Error) => void;
};

let worker: Worker | null | undefined;
const pending = new Map<number, Pending>();
let nextRequestId = 1;

const failAllPending = (message: string): void => {
  pending.forEach(({ reject }) => reject(new Error(message)));
  pending.clear();
};

const getWorker = (): Worker | null => {
  if (worker !== undefined) return worker;
  const isWorkerUnavailable = typeof window === 'undefined' || typeof Worker === 'undefined';
  if (isWorkerUnavailable) {
    worker = null;
    return null;
  }

  try {
    const created = new Worker(new URL('./puzzle.worker.ts', import.meta.url), { type: 'module' });
    created.onmessage = (event: MessageEvent<PuzzleResponse>) => {
      const settle = pending.get(event.data.id);
      if (!settle) return;
      pending.delete(event.data.id);
      if ('error' in event.data) settle.reject(new Error(event.data.error));
      else settle.resolve(event.data.puzzle);
    };
    created.onerror = () => {
      worker = null;
      failAllPending('퍼즐 워커가 종료됨');
    };
    worker = created;
  } catch {
    worker = null;
  }
  return worker;
};

const generate = (gameMode: GameMode, difficulty: Difficulty): Promise<GeneratedPuzzle> => {
  const active = getWorker();
  if (!active) return generatePuzzle(gameMode, difficulty);

  const id = nextRequestId++;
  return new Promise<GeneratedPuzzle>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    active.postMessage({ id, gameMode, difficulty } satisfies PuzzleRequest);
  }).catch(() => generatePuzzle(gameMode, difficulty));
};

const keyOf = (gameMode: GameMode, difficulty: Difficulty): string => `${gameMode}:${difficulty}`;

const prefetched = new Map<string, Promise<GeneratedPuzzle>>();

export const prefetchPuzzle = (gameMode: GameMode, difficulty: Difficulty): void => {
  const key = keyOf(gameMode, difficulty);
  if (prefetched.has(key)) return;
  prefetched.set(key, generate(gameMode, difficulty));
};

export const requestPuzzle = (gameMode: GameMode, difficulty: Difficulty): Promise<GeneratedPuzzle> => {
  const key = keyOf(gameMode, difficulty);
  const ready = prefetched.get(key) ?? generate(gameMode, difficulty);
  prefetched.delete(key);
  prefetchPuzzle(gameMode, difficulty);
  return ready;
};
