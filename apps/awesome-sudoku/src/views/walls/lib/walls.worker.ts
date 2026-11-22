import { chooseMove } from '@views/walls/lib/search';
import type { Move, Side } from '@views/walls/model/types/walls';

export interface MoveRequest {
  id: number;
  moves: readonly Move[];
  side: Side;
}

export type MoveResponse = { id: number; move: Move | null } | { id: number; error: string };

self.onmessage = (event: MessageEvent<MoveRequest>) => {
  const { id, moves, side } = event.data;
  try {
    self.postMessage({ id, move: chooseMove(moves, side) } satisfies MoveResponse);
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) } satisfies MoveResponse);
  }
};
