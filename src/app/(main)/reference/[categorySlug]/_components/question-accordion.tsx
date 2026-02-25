'use client';

import { useState, useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { Button } from '@/shared/ui/button';
import { Bookmark, BookmarkCheck, CheckCircle } from 'lucide-react';
import { MarkdownRenderer } from '@/shared/ui/markdown-renderer';
import { DifficultyBadge } from '@/entities/question/ui/difficulty-badge';
import { toggleBookmark, isBookmarked } from '@/features/bookmark';
import { getProgressForQuestion, updateQuestionProgress } from '@/entities/progress';
import type { Question } from '@/entities/question';

interface QuestionAccordionProps {
  questions: Question[];
  startIndex?: number;
}

export function QuestionAccordion({ questions, startIndex = 0 }: QuestionAccordionProps) {
  // useMemo로 초기값을 계산하여 불필요한 리렌더를 방지한다.
  const initialBookmarks = useMemo(() => {
    const bm: Record<string, boolean> = {};
    for (const q of questions) bm[q.id] = isBookmarked(q.id);
    return bm;
  }, [questions]);

  const initialProgress = useMemo(() => {
    const pg: Record<string, string> = {};
    for (const q of questions) {
      const p = getProgressForQuestion(q.id);
      if (p) pg[q.id] = p.status;
    }
    return pg;
  }, [questions]);

  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(initialBookmarks);
  const [progress, setProgress] = useState<Record<string, string>>(initialProgress);

  const handleBookmarkToggle = (questionId: string) => {
    const result = toggleBookmark(questionId);
    setBookmarks((prev) => ({ ...prev, [questionId]: result }));
  };

  const handleMarkLearned = (questionId: string) => {
    updateQuestionProgress(questionId, true);
    setProgress((prev) => ({ ...prev, [questionId]: 'mastered' }));
  };

  return (
    <Accordion type="multiple" className="space-y-2">
      {questions.map((question, index) => (
        <AccordionItem
          key={question.id}
          value={question.id}
          className="!border rounded-lg px-4"
        >
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-start gap-3 text-left flex-1 mr-4">
              <span className="text-muted-foreground text-sm font-mono mt-0.5 shrink-0">
                {String(startIndex + index + 1).padStart(2, '0')}
              </span>
              <div className="flex flex-col gap-1.5 min-w-0">
                <span className="font-medium text-sm leading-relaxed">
                  {question.question}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <DifficultyBadge difficulty={question.difficulty} />
                  {question.sub_category && (
                    <span className="text-xs text-muted-foreground">
                      {question.sub_category}
                    </span>
                  )}
                  {progress[question.id] === 'mastered' && (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  )}
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="pl-8">
              <MarkdownRenderer content={question.answer} />
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBookmarkToggle(question.id)}
                  className="gap-2"
                >
                  {bookmarks[question.id] ? (
                    <BookmarkCheck className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  {bookmarks[question.id] ? '북마크됨' : '북마크'}
                </Button>
                {progress[question.id] !== 'mastered' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkLearned(question.id)}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    학습 완료
                  </Button>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
