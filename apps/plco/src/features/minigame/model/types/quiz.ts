import { QUIZ_PHASE } from '@features/minigame/model/constants';
import type { CharacterId } from '@shared/types';

export type QuizQuestion = {
  id: string;
  characterId: CharacterId;
  question: string;
  options: string[];
  correctIndex: number;
  fact: string;
};

export type QuizPhase = (typeof QUIZ_PHASE)[keyof typeof QUIZ_PHASE];
