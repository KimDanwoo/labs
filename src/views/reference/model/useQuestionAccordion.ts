'use client';

import { useState, useMemo } from 'react';
import { toggleBookmark, isBookmarked } from '@features/bookmark';
import { getProgressForQuestion, updateQuestionProgress } from '@entities/progress';
import type { Question } from '@entities/question';

/**
 * QuestionAccordion의 북마크·진도 상태와 핸들러를 관리한다.
 * localStorage 접근은 useMemo로 초기 1회만 수행한다.
 */
export function useQuestionAccordion(questions: Question[]) {
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

	return { bookmarks, progress, handleBookmarkToggle, handleMarkLearned };
}
