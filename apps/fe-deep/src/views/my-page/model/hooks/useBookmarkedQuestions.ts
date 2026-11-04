'use client';

import { getAllCategories, getQuestionsByIds } from '@entities/question/model/services';
import { type Category, type Question } from '@entities/question/model/types';
import { getBookmarks, toggleBookmark } from '@features/bookmark/model/services';
import { useEffect, useState } from 'react';

/**
 * localStorage의 북마크 ID를 기반으로 질문과 카테고리를 fetch하고,
 * 북마크 삭제 핸들러를 제공한다.
 */
export function useBookmarkedQuestions() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ids = getBookmarks();
    if (ids.length === 0) return undefined;
    Promise.all([getAllCategories(), getQuestionsByIds(ids)])
      .then(([cats, qs]) => {
        if (!cancelled) {
          setCategories(cats);
          setBookmarkedQuestions(qs);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(new Error('북마크한 질문을 불러오지 못했습니다.', { cause }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRemoveBookmark = (questionId: string) => {
    toggleBookmark(questionId);
    setBookmarkedQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const getCategoryForQuestion = (categoryId: string) => categories.find((c) => c.id === categoryId);

  if (error) throw error;

  return { bookmarkedQuestions, handleRemoveBookmark, getCategoryForQuestion };
}
