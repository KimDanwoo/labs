'use client';

import { Loader2, Sparkles } from 'lucide-react';

import { IS_DEVELOPMENT } from '../../config/environment';
import { splitFeedbackLine, toFeedbackLines } from '../../lib/feedbackLines';
import { useAiFeedback } from '../../model/hooks/useAiFeedback';
import { styles } from './AiFeedback.styles';

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
    <div className={styles.root}>
      <p className={styles.title}>
        <Sparkles className={styles.titleIcon} />
        AI 피드백
      </p>
      {isPending && (
        <p className={styles.pending}>
          <Loader2 className={styles.spinner} />
          피드백 생성 중…
        </p>
      )}
      {error && <p className={styles.error}>{error.message}</p>}
      {lines && (
        <ul className={styles.list}>
          {lines.map((line) => {
            const { label, body } = splitFeedbackLine(line);
            return (
              <li key={line} className={styles.line}>
                {label && <span className={styles.label}>{label}</span>}
                {body}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
