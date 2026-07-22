'use client';

import { Accordion } from '@shared/ui';
import type { Question } from '@entities/question';
import { QuestionAccordionItem } from './QuestionAccordionItem';

interface QuestionAccordionProps {
  questions: Question[];
  startIndex?: number;
}

export function QuestionAccordion({ questions, startIndex = 0 }: QuestionAccordionProps) {
  return (
    <Accordion type="multiple" className="space-y-2.5">
      {questions.map((question, index) => (
        <QuestionAccordionItem key={question.id} question={question} number={startIndex + index + 1} />
      ))}
    </Accordion>
  );
}
