import { GUESS_WORD_RANK } from '@entities/guess-word/config/guessWord';
import { answerIndex } from '@entities/guess-word/lib/puzzleDay';
import {
  foldSenses,
  nearestNeighbors,
  similaritiesTo,
  toDisplaySimilarity,
  type WordVectors,
} from '@entities/guess-word/lib/similarity';
import type { RankHint } from '@entities/guess-word/model/types/guessWord';

export interface WordData {
  words: string[];
  indexByWord: Map<string, number>;
  answers: string[];
  vectors: WordVectors;
  senseOwners: number[];
}

export interface Puzzle {
  day: number;
  answer: number;
  similarities: Float32Array;
  rankByIndex: Map<number, number>;
  hints: RankHint[];
}

function indexesOf(indexByWord: Map<string, number>, targets: string[], label: string): number[] {
  const missing = targets.filter((target) => !indexByWord.has(target));
  if (missing.length > 0) throw new Error(`${label}에 어휘에 없는 단어가 있다: ${missing.slice(0, 5).join(', ')}`);
  return targets.map((target) => indexByWord.get(target) ?? 0);
}

export function createWordData(
  words: string[],
  answers: string[],
  vectors: WordVectors,
  senseWords: string[],
): WordData {
  const indexByWord = new Map(words.map((word, index) => [word, index]));
  indexesOf(indexByWord, answers, '정답 목록');
  const senseOwners = indexesOf(indexByWord, senseWords, '뜻별 벡터 목록');
  return { words, indexByWord, answers, vectors, senseOwners };
}

export function buildPuzzle(data: WordData, day: number): Puzzle {
  const answerWord = data.answers[answerIndex(day, data.answers.length)] ?? '';
  const answer = data.indexByWord.get(answerWord) ?? 0;
  const similarities = foldSenses(similaritiesTo(data.vectors, answer), data.words.length, data.senseOwners);
  const neighbors = nearestNeighbors(similarities, answer, GUESS_WORD_RANK.top);
  const rankByIndex = new Map(neighbors.map((index, position) => [index, position + 1]));
  const hints = GUESS_WORD_RANK.hints.map((rank) => ({
    rank,
    similarity: toDisplaySimilarity(similarities[neighbors[rank - 1] ?? answer] ?? 0),
  }));
  return { day, answer, similarities, rankByIndex, hints };
}
