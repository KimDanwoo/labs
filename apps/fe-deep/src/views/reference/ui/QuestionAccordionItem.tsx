'use client';

import { AccordionContent, AccordionItem, AccordionTrigger } from '@shared/ui';
import { QuestionAnswer, QuestionMeta } from '@entities/question/ui';
import type { Question } from '@entities/question';
import { useQuestionActions } from '../model';
import { QuestionActions } from './QuestionActions';

interface QuestionAccordionItemProps {
  question: Question;
  number: number;
}

export function QuestionAccordionItem({ question, number }: QuestionAccordionItemProps) {
  const { isMastered } = useQuestionActions(question.id);

  return (
    <AccordionItem value={question.id} className="border border-border/60 rounded-xl px-4 shadow-sm">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-start gap-3 text-left flex-1 mr-4">
          <span className="text-muted-foreground/60 text-sm font-mono mt-0.5 shrink-0 tabular-nums">
            {String(number).padStart(2, '0')}
          </span>
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="font-medium text-sm leading-relaxed">{question.question}</span>
            <QuestionMeta difficulty={question.difficulty} subCategory={question.sub_category} isMastered={isMastered} />
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="pl-4 sm:pl-8 overflow-hidden">
          <QuestionAnswer answer={question.answer} />
          <QuestionActions questionId={question.id} questionText={question.question} />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
