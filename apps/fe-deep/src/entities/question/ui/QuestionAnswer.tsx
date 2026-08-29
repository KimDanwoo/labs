import { MarkdownRenderer, SpeakButton } from '@shared/ui';

interface QuestionAnswerProps {
  answer: string;
}

export function QuestionAnswer({ answer }: QuestionAnswerProps) {
  return (
    <div>
      <div className="mb-2 flex justify-end">
        <SpeakButton text={answer} />
      </div>
      <MarkdownRenderer content={answer} />
    </div>
  );
}
