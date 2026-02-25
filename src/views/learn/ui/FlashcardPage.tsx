'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/shared/ui/button';
import { getAllCategories, getRandomQuestions, getQuestionsByIds } from '@/entities/question';
import type { Category, Question } from '@/entities/question';
import {
	getDueCardIds,
	getDueCardCount,
	getLocalProgress,
} from '@/entities/progress';
import { shuffleArray } from '@/shared/lib/shuffle';
import { useCardStudySession } from '../model';
import { FlashcardSetup } from './FlashcardSetup';
import { FlashcardResult } from './FlashcardResult';
import { StudyCardView } from './StudyCardView';

type Phase = 'setup' | 'study' | 'result';
type StudyMode = 'review' | 'new' | 'mixed';

export function FlashcardPage() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [phase, setPhase] = useState<Phase>('setup');
	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [questionCount, setQuestionCount] = useState(10);
	const [studyMode, setStudyMode] = useState<StudyMode>('review');
	const [studyQuestions, setStudyQuestions] = useState<Question[]>([]);
	const [dueCount, setDueCount] = useState(0);

	const onComplete = useCallback(() => {
		setPhase('result');
	}, []);

	const {
		currentIndex,
		currentQuestion,
		isFlipped,
		setIsFlipped,
		results,
		progressPercent,
		isNewCard,
		currentProgress,
		resultCounts,
		handleRate,
		resetStudy,
	} = useCardStudySession({ questions: studyQuestions, phase, onComplete });

	useEffect(() => {
		getAllCategories().then((cats) => {
			setCategories(cats);
			setDueCount(getDueCardCount());
		}).catch(() => {}).finally(() => {
			setIsLoading(false);
		});
	}, []);

	const startStudy = async () => {
		let questions: Question[] = [];

		if (studyMode === 'review') {
			const dueIds = getDueCardIds();
			if (dueIds.length > 0) {
				const sliced = dueIds.slice(0, questionCount);
				questions = await getQuestionsByIds(sliced);
				questions = shuffleArray(questions);
			}
		} else if (studyMode === 'new') {
			questions = selectedCategory === 'all'
				? await getRandomQuestions(questionCount * 2)
				: await getRandomQuestions(questionCount * 2, selectedCategory);
			const allProgress = getLocalProgress();
			questions = questions
				.filter((q) => !allProgress[q.id])
				.slice(0, questionCount);
		} else {
			const dueIds = getDueCardIds();
			const dueQuestions = dueIds.length > 0
				? await getQuestionsByIds(dueIds.slice(0, Math.ceil(questionCount / 2)))
				: [];

			const remaining = questionCount - dueQuestions.length;
			let newQuestions: Question[] = [];
			if (remaining > 0) {
				const candidates = selectedCategory === 'all'
					? await getRandomQuestions(remaining * 2)
					: await getRandomQuestions(remaining * 2, selectedCategory);
				const allProgress = getLocalProgress();
				newQuestions = candidates
					.filter((q) => !allProgress[q.id])
					.slice(0, remaining);
			}

			questions = shuffleArray([...dueQuestions, ...newQuestions]);
		}

		if (questions.length === 0) return;

		setStudyQuestions(questions);
		resetStudy();
		setPhase('study');
	};

	const retryFailedCards = () => {
		const failedIds = new Set(
			results.filter((r) => r.rating === 'again').map((r) => r.questionId),
		);
		const failedQuestions = studyQuestions.filter((q) => failedIds.has(q.id));
		if (failedQuestions.length === 0) return;

		setStudyQuestions(shuffleArray(failedQuestions));
		resetStudy();
		setPhase('study');
	};

	const backToSetup = () => {
		setDueCount(getDueCardCount());
		setPhase('setup');
	};

	if (phase === 'setup') {
		return (
			<FlashcardSetup
				categories={categories}
				isLoading={isLoading}
				dueCount={dueCount}
				studyMode={studyMode}
				onStudyModeChange={setStudyMode}
				selectedCategory={selectedCategory}
				onCategoryChange={setSelectedCategory}
				questionCount={questionCount}
				onQuestionCountChange={setQuestionCount}
				onStart={startStudy}
			/>
		);
	}

	if (phase === 'result') {
		return (
			<FlashcardResult
				resultCounts={resultCounts}
				totalCount={results.length}
				onRetryFailed={retryFailedCards}
				onRestart={startStudy}
				onBackToSetup={backToSetup}
			/>
		);
	}

	return (
		<StudyCardView
			currentIndex={currentIndex}
			totalCount={studyQuestions.length}
			currentQuestion={currentQuestion}
			isFlipped={isFlipped}
			onFlip={() => setIsFlipped(true)}
			progressPercent={progressPercent}
			isNewCard={isNewCard}
			currentProgress={currentProgress}
			onRate={handleRate}
			headerAction={
				<Button variant="ghost" size="sm" onClick={backToSetup}>
					종료
				</Button>
			}
		/>
	);
}
