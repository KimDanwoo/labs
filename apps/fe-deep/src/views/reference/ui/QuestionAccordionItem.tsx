'use client';

import { QuestionMeta, type Question } from '@entities/question';
import { CardAccordionItem } from '@shared/ui/CardAccordionItem';

import { formatQuestionNumber } from '@views/reference/lib/formatQuestionNumber';
import { useQuestionActions } from '@views/reference/model/hooks/useQuestionActions';
import { QuestionActions } from '@views/reference/ui/QuestionActions';
import { QuestionAnswer } from '@views/reference/ui/QuestionAnswer';

interface QuestionAccordionItemProps {
  question: Question;
  number: number;
}

export function QuestionAccordionItem({ question, number }: QuestionAccordionItemProps) {
  const { isMastered } = useQuestionActions(question.id);

  return (
    <CardAccordionItem
      value={question.id}
      trigger={
        <div className="flex items-start gap-3 text-left flex-1 mr-4">
          <span className="text-muted-foreground/60 text-sm font-mono mt-0.5 shrink-0 tabular-nums">
            {formatQuestionNumber(number)}
          </span>
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="font-normal text-sm leading-relaxed">{question.question}</span>
            <QuestionMeta
              difficulty={question.difficulty}
              subCategory={question.sub_category}
              isMastered={isMastered}
            />
          </div>
        </div>
      }
    >
      <div className="pl-4 sm:pl-8 overflow-hidden">
        <QuestionAnswer answer={question.answer} />
        <QuestionActions questionId={question.id} />
      </div>
    </CardAccordionItem>
  );
}
