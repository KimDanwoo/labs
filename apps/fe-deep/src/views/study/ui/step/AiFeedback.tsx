'use client';

import { Loader2, Sparkles } from 'lucide-react';

import { IS_DEVELOPMENT } from '../../config/environment';
import { splitFeedbackLine, toFeedbackLines } from '../../lib/feedbackLines';
import { useAiFeedback } from '../../model/hooks/useAiFeedback';

interface AiFeedbackProps {
  question: string;
  modelAnswer: string;
  recall: string;
}

export function AiFeedback({ question, modelAnswer, recall }: AiFeedbackProps) {
  const { data, error, isPending } = useAiFeedback({ question, modelAnswer, recall });

  if (!IS_DEVELOPMENT) return null;

  const lines = data ? toFeedbackLines(data) : undefined;

  return (
    <div className="rounded-lg border border-border/60 p-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
        <Sparkles className="size-3.5" />
        AI 피드백
      </p>
      {isPending && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          피드백 생성 중…
        </p>
      )}
      {error && <p className="text-sm text-muted-foreground">{error.message}</p>}
      {lines && (
        <ul className="space-y-2.5">
          {lines.map((line) => {
            const { label, body } = splitFeedbackLine(line);
            return (
              <li key={line} className="text-sm leading-relaxed">
                {label && <span className="mr-1.5 font-normal">{label}</span>}
                {body}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
