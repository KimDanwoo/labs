'use client';

import { QuestionAnswer, QuestionMeta, type Question } from '@entities/question';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@shared/ui/Accordion';

import { formatQuestionNumber } from '../lib/formatQuestionNumber';
import { useQuestionActions } from '../model/hooks/useQuestionActions';
import { styles } from './QuestionAccordionItem.styles';
import { QuestionActions } from './QuestionActions';

interface QuestionAccordionItemProps {
  question: Question;
  number: number;
}

export function QuestionAccordionItem({ question, number }: QuestionAccordionItemProps) {
  const { isMastered } = useQuestionActions(question.id);

  return (
    <AccordionItem value={question.id} className={styles.item}>
      <AccordionTrigger className={styles.trigger}>
        <div className={styles.summary}>
          <span className={styles.number}>{formatQuestionNumber(number)}</span>
          <div className={styles.body}>
            <span className={styles.question}>{question.question}</span>
            <QuestionMeta
              difficulty={question.difficulty}
              subCategory={question.sub_category}
              isMastered={isMastered}
            />
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className={styles.content}>
        <div className={styles.answer}>
          <QuestionAnswer answer={question.answer} />
          <QuestionActions questionId={question.id} />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
