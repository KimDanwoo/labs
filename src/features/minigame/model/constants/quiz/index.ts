import type { CharacterId } from '@shared/types';
import type { QuizQuestion } from '../../types';
import { YEKO_QUIZ_QUESTIONS } from './yeko';
import { AKO_QUIZ_QUESTIONS } from './ako';
import { BAMKO_QUIZ_QUESTIONS } from './bamko';
import { EUNKO_QUIZ_QUESTIONS } from './eunko';
import { HAKO_QUIZ_QUESTIONS } from './hako';

export {
  YEKO_QUIZ_QUESTIONS,
  AKO_QUIZ_QUESTIONS,
  BAMKO_QUIZ_QUESTIONS,
  EUNKO_QUIZ_QUESTIONS,
  HAKO_QUIZ_QUESTIONS,
};

export const QUIZ_QUESTIONS_BY_CHARACTER: Record<CharacterId, QuizQuestion[]> = {
  yeko: YEKO_QUIZ_QUESTIONS,
  ako: AKO_QUIZ_QUESTIONS,
  bamko: BAMKO_QUIZ_QUESTIONS,
  eunko: EUNKO_QUIZ_QUESTIONS,
  hako: HAKO_QUIZ_QUESTIONS,
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  ...YEKO_QUIZ_QUESTIONS,
  ...AKO_QUIZ_QUESTIONS,
  ...BAMKO_QUIZ_QUESTIONS,
  ...EUNKO_QUIZ_QUESTIONS,
  ...HAKO_QUIZ_QUESTIONS,
];

function shuffleOptions(q: QuizQuestion): QuizQuestion {
  const indices = q.options.map((_, i) => i);
  indices.sort(() => Math.random() - 0.5);
  const newOptions = indices.map((i) => q.options[i]);
  const newCorrectIndex = indices.indexOf(q.correctIndex);
  return { ...q, options: newOptions, correctIndex: newCorrectIndex };
}

export function pickQuizQuestions(
  count: number,
  characterId?: CharacterId | null,
): QuizQuestion[] {
  const pool = characterId
    ? QUIZ_QUESTIONS_BY_CHARACTER[characterId]
    : QUIZ_QUESTIONS;
  return [...pool]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map(shuffleOptions);
}

export const QUIZ_ROUNDS = 3;

export const QUIZ_PHASE = {
  READY: 'ready',
  PLAYING: 'playing',
  RESULT: 'result',
} as const;
