import { DifficultyBadge } from '@entities/question';
import { Badge } from '@shared/ui/Badge';
import { StepDots } from '@shared/ui/StepDots';

import { FALLBACK_DIFFICULTY } from '../../config/studyCard';
import { useStudySessionContext } from '../../model/hooks/useStudySessionContext';

export function StudySessionBadges() {
  const { currentQuestion, currentFollowUp, stepIndex, stepCount } = useStudySessionContext();

  return (
    <div className="flex items-center gap-2 mb-5">
      {currentFollowUp ? (
        <Badge className="text-xs">꼬꼬무</Badge>
      ) : (
        <DifficultyBadge difficulty={currentQuestion?.difficulty ?? FALLBACK_DIFFICULTY} />
      )}
      {!currentFollowUp && currentQuestion?.sub_category && (
        <Badge variant="secondary" className="text-xs">
          {currentQuestion.sub_category}
        </Badge>
      )}
      {stepCount > 1 && <StepDots stepIndex={stepIndex} stepCount={stepCount} />}
    </div>
  );
}
