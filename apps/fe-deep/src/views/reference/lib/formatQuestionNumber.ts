import { QUESTION_NUMBER_DIGITS } from '../config/pagination';

export function formatQuestionNumber(number: number) {
  return String(number).padStart(QUESTION_NUMBER_DIGITS, '0');
}
