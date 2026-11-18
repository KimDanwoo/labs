'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

import type { FollowUp, Question } from '@entities/question';

import { CARD_SLIDE_MOTION } from '../../config/motion';
import { StudyActions } from './StudyActions';
import { StudyCard } from './StudyCard';
import { styles } from './StudyCardView.styles';
import { StudyProgressHeader } from './StudyProgressHeader';

interface StudyCardViewProps {
  currentIndex: number;
  totalCount: number;
  currentQuestion: Question | undefined;
  currentFollowUp: FollowUp | undefined;
  stepIndex: number;
  stepCount: number;
  isFlipped: boolean;
  onFlip: () => void;
  progressPercent: number;
  isNewCard: boolean;
  onNext: () => void;
  onSkip: () => void;
  onRetry: () => void;
  recallInput: string;
  onRecallChange: (value: string) => void;
  headerAction?: ReactNode;
}

export function StudyCardView({
  currentIndex,
  totalCount,
  currentQuestion,
  currentFollowUp,
  stepIndex,
  stepCount,
  isFlipped,
  onFlip,
  progressPercent,
  isNewCard,
  onNext,
  onSkip,
  onRetry,
  recallInput,
  onRecallChange,
  headerAction,
}: StudyCardViewProps) {
  return (
    <div className={styles.root}>
      <StudyProgressHeader
        currentIndex={currentIndex}
        totalCount={totalCount}
        isNewCard={isNewCard}
        isFlipped={isFlipped}
        progressPercent={progressPercent}
        action={headerAction}
      />

      <AnimatePresence mode="wait">
        <motion.div key={`${currentIndex}-${stepIndex}`} {...CARD_SLIDE_MOTION}>
          <StudyCard
            question={currentQuestion}
            followUp={currentFollowUp}
            stepIndex={stepIndex}
            stepCount={stepCount}
            isFlipped={isFlipped}
            recallInput={recallInput}
            onRecallChange={onRecallChange}
            onFlip={onFlip}
          />
        </motion.div>
      </AnimatePresence>

      <StudyActions
        isFlipped={isFlipped}
        isLastStep={stepIndex + 1 >= stepCount}
        onFlip={onFlip}
        onNext={onNext}
        onRetry={onRetry}
        onSkip={onSkip}
      />
    </div>
  );
}
