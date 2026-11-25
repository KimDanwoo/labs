import { GUESS_WORD_RANK } from '@entities/guess-word/config/guessWord';
import { answerIndex } from '@entities/guess-word/lib/puzzleDay';
import {
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
}

export interface Puzzle {
  day: number;
  answer: number;
  similarities: Float32Array;
  rankByIndex: Map<number, number>;
  hints: RankHint[];
}

export function createWordData(words: string[], answers: string[], vectors: WordVectors): WordData {
  const indexByWord = new Map(words.map((word, index) => [word, index]));
  const missing = answers.filter((answer) => !indexByWord.has(answer));
  if (missing.length > 0) throw new Error(`정답 목록에 어휘에 없는 단어가 있다: ${missing.slice(0, 5).join(', ')}`);
  return { words, indexByWord, answers, vectors };
}

export function buildPuzzle(data: WordData, day: number): Puzzle {
  const answerWord = data.answers[answerIndex(day, data.answers.length)] ?? '';
  const answer = data.indexByWord.get(answerWord) ?? 0;
  const similarities = similaritiesTo(data.vectors, answer);
  const neighbors = nearestNeighbors(similarities, answer, GUESS_WORD_RANK.top);
  const rankByIndex = new Map(neighbors.map((index, position) => [index, position + 1]));
  const hints = GUESS_WORD_RANK.hints.map((rank) => ({
    rank,
    similarity: toDisplaySimilarity(similarities[neighbors[rank - 1] ?? answer] ?? 0),
  }));
  return { day, answer, similarities, rankByIndex, hints };
}
