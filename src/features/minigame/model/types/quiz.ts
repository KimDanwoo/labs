import type { CharacterId } from '@shared/types';

export type QuizQuestion = {
  id: string;
  characterId: CharacterId;
  question: string;
  options: string[];
  correctIndex: number;
  fact: string;
};

export type QuizPhase = 'ready' | 'playing' | 'result';
