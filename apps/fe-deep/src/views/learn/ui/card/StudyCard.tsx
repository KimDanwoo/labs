import { DifficultyBadge, type FollowUp, type Question } from '@entities/question';
import { Badge } from '@shared/ui/Badge';
import { Card } from '@shared/ui/Card';

import { StepDots } from '@shared/ui/StepDots';
import { FALLBACK_DIFFICULTY } from '../../config/studyCard';
import { AnswerReveal } from './AnswerReveal';
import { KeywordHints } from './KeywordHints';
import { RecallInput } from './RecallInput';

interface StudyCardProps {
  question: Question | undefined;
  followUp: FollowUp | undefined;
  stepIndex: number;
  stepCount: number;
  isFlipped: boolean;
  recallInput: string;
  onRecallChange: (value: string) => void;
  onFlip: () => void;
}

export function StudyCard({
  question,
  followUp,
  stepIndex,
  stepCount,
  isFlipped,
  recallInput,
  onRecallChange,
  onFlip,
}: StudyCardProps) {
  const prompt = followUp?.question ?? question?.question ?? '';
  const answer = followUp?.answer ?? question?.answer ?? '';
  const keywords = followUp?.keywords ?? question?.tags ?? [];
  const shouldShowHints = keywords.length > 0 && !(isFlipped && recallInput.trim());

  return (
    <Card className="min-h-[300px] p-6 relative shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        {followUp ? (
          <Badge className="text-xs">꼬꼬무</Badge>
        ) : (
          <DifficultyBadge difficulty={question?.difficulty ?? FALLBACK_DIFFICULTY} />
        )}
        {!followUp && question?.sub_category && (
          <Badge variant="secondary" className="text-xs">
            {question.sub_category}
          </Badge>
        )}
        {stepCount > 1 && <StepDots stepIndex={stepIndex} stepCount={stepCount} />}
      </div>

      <div className="flex flex-col items-center justify-center min-h-[120px] mb-6">
        <p className="text-lg font-normal text-center leading-relaxed whitespace-pre-line">{prompt}</p>
      </div>

      {shouldShowHints && <KeywordHints keywords={keywords} />}

      {isFlipped ? (
        <AnswerReveal answer={answer} recallInput={recallInput} keywords={keywords} />
      ) : (
        <RecallInput value={recallInput} onChange={onRecallChange} onSubmit={onFlip} />
      )}
    </Card>
  );
}
