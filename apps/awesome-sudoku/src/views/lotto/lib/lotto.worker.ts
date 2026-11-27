import { createCryptoRandom } from '@views/lotto/lib/random';
import { simulateInChunks } from '@views/lotto/lib/simulate';
import type { SimulationRequest, SimulationResult } from '@views/lotto/model/types/lotto';

export type SimulationMessage = { type: 'progress'; result: SimulationResult } | { type: 'done' };

self.onmessage = (event: MessageEvent<SimulationRequest>) => {
  const randomInt = createCryptoRandom();
  for (const result of simulateInChunks(event.data, randomInt)) {
    self.postMessage({ type: 'progress', result } satisfies SimulationMessage);
  }
  self.postMessage({ type: 'done' } satisfies SimulationMessage);
};
