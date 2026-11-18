'use client';

import { Badge } from '@shared/ui/Badge';
import { Card } from '@shared/ui/Card';
import { StepDots } from '@shared/ui/StepDots';

import { STEP_BADGE } from '../../config/step';
import type { StudyStep } from '../../lib/parseHandbook';
import { styles } from './StepCard.styles';
import { StepHints } from './StepHints';
import { StepRecallInput } from './StepRecallInput';
import { StepReveal } from './StepReveal';

interface StepCardProps {
  step: StudyStep;
  stepIndex: number;
  stepCount: number;
  isRevealed: boolean;
  recall: string;
  onRecallChange: (value: string) => void;
  onReveal: () => void;
}

export function StepCard({ step, stepIndex, stepCount, isRevealed, recall, onRecallChange, onReveal }: StepCardProps) {
  const badge = STEP_BADGE[step.kind];
  const shouldShowHints = step.keywords.length > 0 && !(isRevealed && recall.trim());

  return (
    <Card className={styles.card}>
      <div className={styles.meta}>
        <Badge variant={badge.variant} className={styles.badge}>
          {badge.label}
        </Badge>
        <StepDots stepIndex={stepIndex} stepCount={stepCount} />
      </div>

      <p className={styles.prompt}>{step.prompt}</p>

      {shouldShowHints && <StepHints keywords={step.keywords} />}

      {isRevealed ? (
        <StepReveal step={step} recall={recall} />
      ) : (
        <StepRecallInput value={recall} onChange={onRecallChange} onSubmit={onReveal} />
      )}
    </Card>
  );
}
