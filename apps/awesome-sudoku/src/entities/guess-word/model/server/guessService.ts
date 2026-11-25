import { GUESS_WORD_ERROR } from '@entities/guess-word/config/guessWord';
import { isValidGuess, normalizeGuess } from '@entities/guess-word/lib/guessInput';
import { buildPuzzle, type Puzzle, type WordData } from '@entities/guess-word/lib/puzzle';
import { puzzleDay } from '@entities/guess-word/lib/puzzleDay';
import { toDisplaySimilarity } from '@entities/guess-word/lib/similarity';
import { loadWordData } from '@entities/guess-word/model/server/loadWordData';
import type {
  AnswerResult,
  GuessErrorBody,
  GuessResult,
  HintsResult,
} from '@entities/guess-word/model/types/guessWord';

let cachedPuzzle: Puzzle | undefined;

async function todayPuzzle(now: Date): Promise<{ data: WordData; puzzle: Puzzle }> {
  const data = await loadWordData();
  const day = puzzleDay(now);
  if (cachedPuzzle?.day !== day) cachedPuzzle = buildPuzzle(data, day);
  return { data, puzzle: cachedPuzzle };
}

export async function guessWord(rawWord: string, now: Date): Promise<GuessResult | GuessErrorBody> {
  const { data, puzzle } = await todayPuzzle(now);
  const word = normalizeGuess(rawWord);
  if (!isValidGuess(word)) return { day: puzzle.day, error: GUESS_WORD_ERROR.INVALID };
  const index = data.indexByWord.get(word);
  if (index === undefined) return { day: puzzle.day, error: GUESS_WORD_ERROR.UNKNOWN };
  return {
    day: puzzle.day,
    word,
    similarity: toDisplaySimilarity(puzzle.similarities[index] ?? 0),
    rank: puzzle.rankByIndex.get(index) ?? null,
    isAnswer: index === puzzle.answer,
  };
}

export async function todayHints(now: Date): Promise<HintsResult> {
  const { puzzle } = await todayPuzzle(now);
  return { day: puzzle.day, hints: puzzle.hints };
}

export async function todayAnswer(now: Date): Promise<AnswerResult> {
  const { data, puzzle } = await todayPuzzle(now);
  return { day: puzzle.day, word: data.words[puzzle.answer] ?? '' };
}
