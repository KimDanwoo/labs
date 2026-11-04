import type { Difficulty, GameMode } from '@entities/game/model/types';
import { generatePuzzle, type GeneratedPuzzle } from './puzzleGenerator';

export type PuzzleRequest = { id: number; gameMode: GameMode; difficulty: Difficulty };
export type PuzzleResponse = { id: number; puzzle: GeneratedPuzzle } | { id: number; error: string };

/**
 * 퍼즐 생성 전용 워커. 채점 재시도 때문에 클래식 expert p95 ≈ 0.5초, 킬러 expert ≈ 0.15초가 걸려
 * 메인 스레드에서 돌리면 "새 게임"을 누른 순간 화면이 멈춘다.
 */
self.onmessage = (event: MessageEvent<PuzzleRequest>) => {
  const { id, gameMode, difficulty } = event.data;
  try {
    self.postMessage({ id, puzzle: generatePuzzle(gameMode, difficulty) } satisfies PuzzleResponse);
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) } satisfies PuzzleResponse);
  }
};
