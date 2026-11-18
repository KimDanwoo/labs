import { KeywordCheck } from '@features/keyword-check';
import { SpeakButton } from '@features/read-aloud';
import { MarkdownRenderer } from '@shared/ui/markdown-renderer';

import type { StudyStep } from '../../lib/parseHandbook';
import { AiFeedback } from './AiFeedback';
import { AnswerFramePrompt } from './AnswerFramePrompt';

interface StepRevealProps {
  step: StudyStep;
  recall: string;
}

export function StepReveal({ step, recall }: StepRevealProps) {
  const hasRecall = Boolean(recall.trim());

  return (
    <div className="mt-6 space-y-5 border-t border-border/50 pt-5">
      {hasRecall && (
        <div className="rounded-lg bg-muted/40 p-4">
          <p className="mb-2 text-xs font-normal text-muted-foreground">내가 말한 것</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{recall}</p>
        </div>
      )}
      {hasRecall && step.keywords.length > 0 && <KeywordCheck keywords={step.keywords} recall={recall} />}
      {hasRecall && <AiFeedback key={step.id} question={step.prompt} modelAnswer={step.reveal} recall={recall} />}
      {step.reveal ? (
        <div>
          <div className="mb-2 flex justify-end">
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
