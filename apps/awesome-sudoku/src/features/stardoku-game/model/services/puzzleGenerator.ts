import { boardSizeForStage, generatePuzzle, minLogicDepthForStage } from '@entities/stardoku/model/generator';
import type { StardokuPuzzle } from '@entities/stardoku/model/types';
import type { PuzzleRequest, PuzzleResponse } from './puzzle.worker';

interface Pending {
  resolve: (puzzle: StardokuPuzzle) => void;
  reject: (error: Error) => void;
}

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

const generate = (size: number, minLogicDepth: number): Promise<StardokuPuzzle> => {
  const active = getWorker();
  if (!active) return Promise.resolve(generatePuzzle(size, minLogicDepth));

  const id = nextRequestId++;
  return new Promise<StardokuPuzzle>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    active.postMessage({ id, size, minLogicDepth } satisfies PuzzleRequest);
  }).catch(() => generatePuzzle(size, minLogicDepth));
};

const paramsForStage = (stage: number) => ({
  size: boardSizeForStage(stage),
  minLogicDepth: minLogicDepthForStage(stage),
});

/** 미리 만들어둔 판 한 장. 클리어 연출 1.1초 동안 다음 판을 미리 뽑아 대기 시간을 0으로 만든다 */
let prefetched: { stage: number; promise: Promise<StardokuPuzzle> } | null = null;

export const prefetchStagePuzzle = (stage: number): void => {
  if (prefetched?.stage === stage) return;
  const { size, minLogicDepth } = paramsForStage(stage);
  prefetched = { stage, promise: generate(size, minLogicDepth) };
};

export const requestStagePuzzle = (stage: number): Promise<StardokuPuzzle> => {
  if (prefetched?.stage === stage) {
    const { promise } = prefetched;
    prefetched = null;
    return promise;
  }
  const { size, minLogicDepth } = paramsForStage(stage);
  return generate(size, minLogicDepth);
};
