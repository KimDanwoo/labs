import { motion } from 'framer-motion';

import { KeywordCheck } from '@shared/ui/KeywordCheck';
import { MarkdownRenderer } from '@shared/ui/markdown-renderer';

import { ANSWER_REVEAL_MOTION } from '../../config/motion';
import { styles } from './StudyCardView.styles';

interface AnswerRevealProps {
  answer: string;
  recallInput: string;
  keywords: string[];
}

export function AnswerReveal({ answer, recallInput, keywords }: AnswerRevealProps) {
  const hasRecall = Boolean(recallInput.trim());

  return (
    <motion.div {...ANSWER_REVEAL_MOTION}>
      <div className={styles.answer}>
        {hasRecall && (
          <div className={styles.myAnswer}>
            <p className={styles.answerLabel}>내 답변</p>
            <p className={styles.myAnswerText}>{recallInput}</p>
          </div>
        )}
        {hasRecall && keywords.length > 0 && <KeywordCheck keywords={keywords} recall={recallInput} />}
        <div>
          <p className={styles.answerLabel}>모범 답변</p>
          <MarkdownRenderer content={answer} />
        </div>
      </div>
    </motion.div>
  );
}
