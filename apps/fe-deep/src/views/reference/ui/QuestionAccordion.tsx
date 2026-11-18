'use client';

import type { Question } from '@entities/question';
import { Accordion } from '@shared/ui/Accordion';

import { styles } from './QuestionAccordion.styles';
import { QuestionAccordionItem } from './QuestionAccordionItem';

interface QuestionAccordionProps {
  questions: Question[];
  startIndex?: number;
}

export function QuestionAccordion({ questions, startIndex = 0 }: QuestionAccordionProps) {
  return (
    <Accordion type="single" collapsible className={styles.list}>
      {questions.map((question, index) => (
        <QuestionAccordionItem key={question.id} question={question} number={startIndex + index + 1} />
      ))}
    </Accordion>
  );
}
