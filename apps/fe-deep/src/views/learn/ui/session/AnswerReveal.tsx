import { motion } from 'framer-motion';

import { KeywordCheck } from '@features/keyword-check';
import { MarkdownRenderer } from '@shared/ui/markdown-renderer';

import { ANSWER_REVEAL_MOTION } from '@views/learn/config/motion';

interface AnswerRevealProps {
  answer: string;
  recallInput: string;
  keywords: string[];
}

export function AnswerReveal({ answer, recallInput, keywords }: AnswerRevealProps) {
  const hasRecall = Boolean(recallInput.trim());

  return (
    <motion.div {...ANSWER_REVEAL_MOTION}>
      <div className="border-t border-border/50 pt-5 space-y-5">
        {hasRecall && (
          <div className="rounded-lg bg-muted/40 p-4">
            <p className="text-xs font-normal text-muted-foreground mb-2">내 답변</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{recallInput}</p>
          </div>
        )}
        {hasRecall && keywords.length > 0 && <KeywordCheck keywords={keywords} recall={recallInput} />}
        <div>
          <p className="text-xs font-normal text-muted-foreground mb-2">모범 답변</p>
          <MarkdownRenderer content={answer} />
        </div>
      </div>
    </motion.div>
  );
}
