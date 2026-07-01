'use client';

import { useState, useEffect } from 'react';
import { getBookmarks, toggleBookmark } from '@features/bookmark';
import { getQuestionsByIds, getAllCategories } from '@entities/question';
import type { Category, Question } from '@entities/question';

/**
 * localStorage의 북마크 ID를 기반으로 질문과 카테고리를 fetch하고,
 * 북마크 삭제 핸들러를 제공한다.
 */
export function useBookmarkedQuestions() {
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

	return { bookmarkedQuestions, handleRemoveBookmark, getCategoryForQuestion };
}
