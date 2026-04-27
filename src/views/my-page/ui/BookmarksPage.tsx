'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Bookmark, Trash2 } from 'lucide-react';
import { getBookmarks, toggleBookmark } from '@/features/bookmark';
import { getQuestionsByIds, getAllCategories } from '@/entities/question';
import type { Category, Question } from '@/entities/question';
import { MarkdownRenderer } from '@/shared/ui/MarkdownRenderer';
import { DifficultyBadge } from '@/entities/question/ui/DifficultyBadge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/shared/ui/Accordion';

export function BookmarksPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Question[]>([]);

  useEffect(() => {
    let cancelled = false;
    const ids = getBookmarks();
    if (ids.length === 0) return;
    Promise.all([getAllCategories(), getQuestionsByIds(ids)]).then(([cats, qs]) => {
      if (!cancelled) {
        setCategories(cats);
        setBookmarkedQuestions(qs);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const handleRemoveBookmark = (questionId: string) => {
    toggleBookmark(questionId);
    setBookmarkedQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const getCategoryForQuestion = (categoryId: string) =>
    categories.find((c) => c.id === categoryId);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Bookmark className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">북마크</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        북마크한 질문을 모아서 학습하세요. ({bookmarkedQuestions.length}개)
      </p>

      {bookmarkedQuestions.length > 0 ? (
        <Accordion type="multiple" className="space-y-2.5">
          {bookmarkedQuestions.map((question) => {
            const category = getCategoryForQuestion(question.category_id);
            return (
              <AccordionItem
                key={question.id}
                value={question.id}
                className="border border-border/60 rounded-xl px-4 shadow-sm"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex flex-col gap-1.5 text-left flex-1 mr-4">
                    <span className="font-medium text-sm leading-relaxed">
                      {question.question}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {category && (
                        <Badge variant="outline" className="text-xs">
                          {category.icon} {category.title}
                        </Badge>
                      )}
                      <DifficultyBadge difficulty={question.difficulty} />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <MarkdownRenderer content={question.answer} />
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBookmark(question.id)}
                      className="gap-2 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      북마크 삭제
                    </Button>
                    {category && (
                      <Link href={`/reference/${category.slug}`}>
                        <Button variant="ghost" size="sm">
                          {category.title}에서 보기 →
                        </Button>
                      </Link>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <Card className="p-16 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Bookmark className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground">
            아직 북마크한 질문이 없습니다.
          </p>
          <Link href="/reference">
            <Button variant="link" className="mt-3">
              레퍼런스에서 질문 북마크하기 →
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
