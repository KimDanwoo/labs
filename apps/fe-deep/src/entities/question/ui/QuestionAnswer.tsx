import { MarkdownRenderer } from '@shared/ui';

interface QuestionAnswerProps {
  answer: string;
}

export function QuestionAnswer({ answer }: QuestionAnswerProps) {
  return <MarkdownRenderer content={answer} />;
}
