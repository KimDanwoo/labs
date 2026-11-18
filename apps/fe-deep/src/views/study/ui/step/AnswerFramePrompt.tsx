import { Lightbulb } from 'lucide-react';

import { ANSWER_FRAME, ANSWER_FRAME_SEPARATOR } from '../../config/step';
import { styles } from './StepCard.styles';

export function AnswerFramePrompt() {
  return (
    <div className={styles.frame}>
      <Lightbulb className={styles.frameIcon} />
      <p className={styles.frameText}>
        이 질문엔 정해진 답이 없습니다. 아래 순서로 직접 정리해보세요.
        <span className={styles.frameSteps}>{ANSWER_FRAME.join(ANSWER_FRAME_SEPARATOR)}</span>
      </p>
    </div>
  );
}
