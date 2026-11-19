import type { FollowUp, Question } from '@entities/question';

export interface StepContent {
  prompt: string;
  answer: string;
  keywords: string[];
}

const EMPTY_STEP: StepContent = { prompt: '', answer: '', keywords: [] };

export function getStepContent(question: Question | undefined, followUp: FollowUp | undefined): StepContent {
  if (followUp) return { prompt: followUp.question, answer: followUp.answer, keywords: followUp.keywords };
  if (question) return { prompt: question.question, answer: question.answer, keywords: question.tags };
  return EMPTY_STEP;
}
