'use client';

import { PHASE } from '../model/constants/study';
import { useLearnFlow } from '../model/hooks/useLearnFlow';
import { StudyCardView } from './card/StudyCardView';
import { LearnDone } from './LearnDone';
import { LearnExitButton } from './LearnExitButton';
import { LearnSetup } from './setup/LearnSetup';

export function LearnPage() {
  const flow = useLearnFlow();
  const { session } = flow;

  if (flow.phase === PHASE.setup || flow.phase === PHASE.loading) {
    return (
      <LearnSetup
        categories={flow.categories}
        isLoadingCategories={flow.isLoadingCategories}
        initialSettings={flow.settings}
        isStarting={flow.phase === PHASE.loading}
        isEmpty={flow.isEmpty}
        onStart={flow.startStudy}
      />
    );
  }

  if (flow.phase === PHASE.done) {
    return <LearnDone questionCount={flow.questionCount} streak={flow.streak} onRestart={flow.backToSetup} />;
  }

  return (
    <StudyCardView
      currentIndex={session.currentIndex}
      totalCount={flow.questionCount}
      currentQuestion={session.currentQuestion}
      currentFollowUp={session.currentFollowUp}
      stepIndex={session.stepIndex}
      stepCount={session.stepCount}
      isFlipped={session.isFlipped}
      onFlip={() => session.setIsFlipped(true)}
      progressPercent={session.progressPercent}
      isNewCard={session.isNewCard}
      onNext={session.handleNext}
      onSkip={session.handleSkip}
      onRetry={session.handleRetry}
      recallInput={session.recallInput}
      onRecallChange={session.setRecallInput}
      headerAction={<LearnExitButton onExit={flow.backToSetup} />}
    />
  );
}
