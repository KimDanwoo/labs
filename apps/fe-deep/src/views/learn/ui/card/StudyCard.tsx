import { DifficultyBadge, type FollowUp, type Question } from '@entities/question';
import { Badge } from '@shared/ui/Badge';
import { Card } from '@shared/ui/Card';

import { StepDots } from '@shared/ui/StepDots';
import { FALLBACK_DIFFICULTY } from '../../config/studyCard';
import { AnswerReveal } from './AnswerReveal';
import { KeywordHints } from './KeywordHints';
import { RecallInput } from './RecallInput';
import { styles } from './StudyCardView.styles';

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
    <Card className={styles.card}>
      <div className={styles.cardMeta}>
        {followUp ? (
          <Badge className={styles.badge}>꼬꼬무</Badge>
        ) : (
          <DifficultyBadge difficulty={question?.difficulty ?? FALLBACK_DIFFICULTY} />
        )}
        {!followUp && question?.sub_category && (
          <Badge variant="secondary" className={styles.badge}>
            {question.sub_category}
          </Badge>
        )}
        {stepCount > 1 && <StepDots stepIndex={stepIndex} stepCount={stepCount} />}
      </div>

      <div className={styles.promptBox}>
        <p className={styles.prompt}>{prompt}</p>
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
