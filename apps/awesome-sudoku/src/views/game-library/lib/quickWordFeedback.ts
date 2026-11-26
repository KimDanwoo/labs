import { WORD_MESSAGES, type QuickWordRound } from '@views/game-library/config/quickWords';

interface WordFeedbackOptions {
  result: QuickWordRound['result'];
  answer: string;
  hasMoreHints: boolean;
}

export function quickWordFeedback({ result, answer, hasMoreHints }: WordFeedbackOptions): string {
  if (result === 'revealed') return `정답은 ${answer}예요.`;
  const isLastHintMiss = result === 'retry' && !hasMoreHints;
  if (isLastHintMiss) return '다른 단어예요. 한 번 더 시도하거나 정답을 볼 수 있어요.';
  return WORD_MESSAGES[result];
}
