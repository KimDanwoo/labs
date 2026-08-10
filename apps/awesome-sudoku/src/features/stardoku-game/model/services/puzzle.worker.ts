import { generatePuzzle } from '@entities/stardoku/model/generator';
import { StardokuPuzzle } from '@entities/stardoku/model/types';

export interface PuzzleRequest {
  id: number;
  size: number;
  minLogicDepth: number;
}

export type PuzzleResponse = { id: number; puzzle: StardokuPuzzle } | { id: number; error: string };

/**
 * 퍼즐 생성 전용 워커. 생성은 거부 샘플링이라 깊은 판일수록 오래 걸리고(10×10 깊이5 최악 수백 ms),
 * 메인 스레드에서 돌리면 보드 전환 애니메이션이 그대로 멈춘다.
 */
self.onmessage = (event: MessageEvent<PuzzleRequest>) => {
  const { id, size, minLogicDepth } = event.data;
  try {
    const puzzle = generatePuzzle(size, minLogicDepth);
    self.postMessage({ id, puzzle } satisfies PuzzleResponse);
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) } satisfies PuzzleResponse);
  }
};
