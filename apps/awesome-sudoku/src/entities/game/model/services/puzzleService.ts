import type { Difficulty, GameMode } from '@entities/game/model/types';
import type { PuzzleRequest, PuzzleResponse } from './puzzle.worker';
import { generatePuzzle, type GeneratedPuzzle } from './puzzleGenerator';

type Pending = {
  resolve: (puzzle: GeneratedPuzzle) => void;
  reject: (error: Error) => void;
};

/** undefined = 아직 안 만들어봄 · null = 이 환경에선 못 씀(SSR·jsdom·생성 실패) → 동기 폴백 */
let worker: Worker | null | undefined;
const pending = new Map<number, Pending>();
let nextRequestId = 1;

const failAllPending = (message: string): void => {
  pending.forEach(({ reject }) => reject(new Error(message)));
  pending.clear();
};

const getWorker = (): Worker | null => {
  if (worker !== undefined) return worker;
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
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
    // 워커가 죽으면 이후 요청은 메인 스레드에서 처리한다 — 판을 못 주는 것보다 잠깐 버벅이는 게 낫다
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
  if (!active) return Promise.resolve(generatePuzzle(gameMode, difficulty));

  const id = nextRequestId++;
  return new Promise<GeneratedPuzzle>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    active.postMessage({ id, gameMode, difficulty } satisfies PuzzleRequest);
  }).catch(() => generatePuzzle(gameMode, difficulty));
};

const keyOf = (gameMode: GameMode, difficulty: Difficulty): string => `${gameMode}:${difficulty}`;

/** 모드·난이도별로 다음 판 한 장을 미리 뽑아 둔다 — 같은 설정으로 "새 게임"을 누르면 대기 시간이 0이다 */
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
