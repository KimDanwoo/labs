import { MarkdownRenderer } from '@shared/ui/markdown-renderer';
import { SpeakButton } from '@shared/ui/SpeakButton';

import { styles } from './QuestionAnswer.styles';

interface QuestionAnswerProps {
  answer: string;
}

export function QuestionAnswer({ answer }: QuestionAnswerProps) {
  return (
    <div>
      <div className={styles.actions}>
        <SpeakButton text={answer} />
      </div>
      <MarkdownRenderer content={answer} />
    </div>
  );
}
