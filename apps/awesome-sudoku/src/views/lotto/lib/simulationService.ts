import type { SimulationMessage } from '@views/lotto/lib/lotto.worker';
import { createCryptoRandom } from '@views/lotto/lib/random';
import { simulateInChunks } from '@views/lotto/lib/simulate';
import type { SimulationRequest, SimulationResult } from '@views/lotto/model/types/lotto';

type ProgressListener = (result: SimulationResult) => void;

export interface SimulationHandle {
  finished: Promise<SimulationResult | null>;
  cancel: () => void;
}

const yieldToBrowser = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const createWorker = (): Worker | null => {
  if (typeof Worker === 'undefined') return null;
  try {
    return new Worker(new URL('./lotto.worker.ts', import.meta.url), { type: 'module' });
  } catch {
    return null;
  }
};

function runInPlace(request: SimulationRequest, onProgress: ProgressListener): SimulationHandle {
  let isCancelled = false;
  const run = async (): Promise<SimulationResult | null> => {
    let latest: SimulationResult | null = null;
    for (const result of simulateInChunks(request, createCryptoRandom())) {
      if (isCancelled) return null;
      latest = result;
      onProgress(result);
      await yieldToBrowser();
    }
    return isCancelled ? null : latest;
  };
  return {
    finished: run(),
    cancel: () => {
      isCancelled = true;
    },
  };
}

function runInWorker(worker: Worker, request: SimulationRequest, onProgress: ProgressListener): SimulationHandle {
  let latest: SimulationResult | null = null;
  let fallback: SimulationHandle | null = null;
  let settle: (result: SimulationResult | null) => void = () => undefined;
  const finished = new Promise<SimulationResult | null>((resolve) => {
    settle = resolve;
  });
  const stop = (result: SimulationResult | null): void => {
    worker.terminate();
    settle(result);
  };

  worker.onmessage = (event: MessageEvent<SimulationMessage>) => {
    if (event.data.type === 'done') {
      stop(latest);
      return;
    }
    latest = event.data.result;
    onProgress(latest);
  };
  worker.onerror = () => {
    worker.terminate();
    fallback = runInPlace(request, onProgress);
    fallback.finished.then(settle);
  };
  worker.postMessage(request);

  const cancel = (): void => {
    if (fallback) {
      fallback.cancel();
      return;
    }
    stop(null);
  };
  return { finished, cancel };
}

export function startSimulation(request: SimulationRequest, onProgress: ProgressListener): SimulationHandle {
  const worker = createWorker();
  if (!worker) return runInPlace(request, onProgress);
  return runInWorker(worker, request, onProgress);
}
