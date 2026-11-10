import { MarkdownRenderer } from '@shared/ui/MarkdownRenderer';
import { SpeakButton } from '@shared/ui/SpeakButton';

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
