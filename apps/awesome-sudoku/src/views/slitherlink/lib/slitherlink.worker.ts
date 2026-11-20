import { generateSlitherlink } from '@views/slitherlink/lib/puzzleGenerator';
import type { SlitherlinkLevel, SlitherlinkPuzzle } from '@views/slitherlink/model/types/slitherlink';

export interface SlitherlinkRequest {
  id: number;
  level: SlitherlinkLevel;
}

export type SlitherlinkResponse = { id: number; puzzle: SlitherlinkPuzzle } | { id: number; error: string };

self.onmessage = (event: MessageEvent<SlitherlinkRequest>) => {
  const { id, level } = event.data;
  try {
    self.postMessage({ id, puzzle: generateSlitherlink(level) } satisfies SlitherlinkResponse);
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    } satisfies SlitherlinkResponse);
  }
};
