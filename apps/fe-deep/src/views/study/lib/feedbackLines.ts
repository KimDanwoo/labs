import { FEEDBACK_LABEL_SEPARATOR, MAX_FEEDBACK_LABEL_LENGTH } from '../config/feedback';

export interface FeedbackLine {
  label: string;
  body: string;
}

export function splitFeedbackLine(line: string): FeedbackLine {
  const separatorIndex = line.indexOf(FEEDBACK_LABEL_SEPARATOR);
  if (separatorIndex < 1 || separatorIndex > MAX_FEEDBACK_LABEL_LENGTH) return { label: '', body: line };
  return { label: line.slice(0, separatorIndex).trim(), body: line.slice(separatorIndex + 1).trim() };
}

export function toFeedbackLines(feedback: string): string[] {
  return feedback
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}
