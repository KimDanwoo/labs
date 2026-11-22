import { chooseMove } from '@views/gomoku/lib/search';
import type { Stone } from '@views/gomoku/model/types/gomoku';

export interface MoveRequest {
  id: number;
  cells: readonly number[];
  stone: Stone;
}

export type MoveResponse = { id: number; cell: number } | { id: number; error: string };

self.onmessage = (event: MessageEvent<MoveRequest>) => {
  const { id, cells, stone } = event.data;
  try {
    self.postMessage({ id, cell: chooseMove(cells, stone) } satisfies MoveResponse);
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) } satisfies MoveResponse);
  }
};
