export function nextStepLabel(isRevealed: boolean, isLastStep: boolean, isLastTopic: boolean): string {
  if (!isRevealed) return '답 확인';
  if (!isLastStep) return '다음 단계';
  if (!isLastTopic) return '다음 주제';
  return '마지막';
}
