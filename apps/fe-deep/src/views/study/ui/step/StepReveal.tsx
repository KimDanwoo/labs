import { KeywordCheck } from '@shared/ui/KeywordCheck';
import { MarkdownRenderer } from '@shared/ui/markdown-renderer';
import { SpeakButton } from '@shared/ui/SpeakButton';

import type { StudyStep } from '../../lib/parseHandbook';
import { AiFeedback } from './AiFeedback';
import { AnswerFramePrompt } from './AnswerFramePrompt';
import { styles } from './StepCard.styles';

interface StepRevealProps {
  step: StudyStep;
  recall: string;
}

export function StepReveal({ step, recall }: StepRevealProps) {
  const hasRecall = Boolean(recall.trim());

  return (
    <div className={styles.reveal}>
      {hasRecall && (
        <div className={styles.recallBox}>
          <p className={styles.recallLabel}>내가 말한 것</p>
          <p className={styles.recallText}>{recall}</p>
        </div>
      )}
      {hasRecall && step.keywords.length > 0 && <KeywordCheck keywords={step.keywords} recall={recall} />}
      {hasRecall && <AiFeedback key={step.id} question={step.prompt} modelAnswer={step.reveal} recall={recall} />}
      {step.reveal ? (
        <div>
          <div className={styles.speak}>
            <SpeakButton text={step.reveal} />
          </div>
          <MarkdownRenderer content={step.reveal} />
        </div>
      ) : (
        <AnswerFramePrompt />
      )}
    </div>
  );
}
