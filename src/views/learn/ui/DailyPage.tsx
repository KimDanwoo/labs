'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { getRandomQuestions, getQuestionsByIds } from '@/entities/question';
import type { Question } from '@/entities/question';
import {
	getDueCardIds,
	getLocalProgress,
	getCurrentStreak,
} from '@/entities/progress';
import { shuffleArray } from '@/shared/lib/shuffle';
import { useCardStudySession } from '../model';
import { isDailyDone, markDailyDone } from '../model';
import { StudyCardView } from './StudyCardView';
import { ResultScoreCard } from './ResultScoreCard';
import {
	Flame,
	Trophy,
	ArrowRight,
	Calendar,
} from 'lucide-react';

const DAILY_COUNT = 5;

type Phase = 'loading' | 'ready' | 'study' | 'done' | 'already-done';

export function DailyPage() {
	const alreadyDone = typeof window !== 'undefined' && isDailyDone();
	const [phase, setPhase] = useState<Phase>(() => alreadyDone ? 'already-done' : 'loading');
	const [questions, setQuestions] = useState<Question[]>([]);
	const [streak, setStreak] = useState(() => alreadyDone ? getCurrentStreak() : 0);

	const onComplete = useCallback(() => {
		markDailyDone();
		setStreak(getCurrentStreak());
		setPhase('done');
	}, []);

	const {
		currentIndex,
		currentQuestion,
		isFlipped,
		setIsFlipped,
		results,
		progressPercent,
		isNewCard,
		resultCounts,
		handleRate,
	} = useCardStudySession({ questions, phase, onComplete });

	useEffect(() => {
		if (alreadyDone) return;

		async function loadDailyQuestions(): Promise<Question[]> {
			const dueIds = getDueCardIds();
			let selected: Question[] = [];

			if (dueIds.length > 0) {
				const dueQuestions = await getQuestionsByIds(dueIds.slice(0, DAILY_COUNT));
				selected = dueQuestions;
			}

			if (selected.length < DAILY_COUNT) {
				const remaining = DAILY_COUNT - selected.length;
				const candidates = await getRandomQuestions(remaining * 3);
				const existingIds = new Set(selected.map((q) => q.id));
				const allProgress = getLocalProgress();
				const newCards = candidates
					.filter((q) => !existingIds.has(q.id) && !allProgress[q.id])
					.slice(0, remaining);
				selected = [...selected, ...newCards];
			}

			return shuffleArray(selected);
		}

		loadDailyQuestions().then((qs) => {
			setQuestions(qs);
			setStreak(getCurrentStreak());
			setPhase('ready');
		}).catch(() => {
			setPhase('ready');
		});
	}, [alreadyDone]);

	// ==================== LOADING ====================
	if (phase === 'loading') {
		return (
			<div className="container mx-auto max-w-2xl px-4 py-8">
				<div className="text-center text-muted-foreground py-12">
					오늘의 문제를 준비하고 있습니다...
				</div>
			</div>
		);
	}

	// ==================== ALREADY DONE ====================
	if (phase === 'already-done') {
		return (
			<div className="container mx-auto max-w-2xl px-4 py-8">
				<div className="text-center py-12">
					<Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
					<h1 className="text-3xl font-bold mb-2">오늘의 챌린지 완료!</h1>
					<p className="text-muted-foreground mb-6">
						오늘 학습을 이미 마쳤습니다. 내일 다시 도전하세요.
					</p>

					{streak > 0 && (
						<div className="flex items-center justify-center gap-2 mb-8">
							<Flame className="h-6 w-6 text-orange-500" />
							<span className="text-xl font-bold">{streak}일 연속 학습 중!</span>
						</div>
					)}

					<div className="flex gap-3 justify-center">
						<Link href="/learn/flashcard">
							<Button variant="outline" className="gap-2">
								플래시카드로 더 학습
								<ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
						<Link href="/mypage/progress">
							<Button variant="ghost" className="gap-2">
								학습 현황 보기
							</Button>
						</Link>
					</div>
				</div>
			</div>
		);
	}

	// ==================== READY ====================
	if (phase === 'ready') {
		return (
			<div className="container mx-auto max-w-2xl px-4 py-8">
				<h1 className="text-3xl font-bold mb-2">오늘의 챌린지</h1>
				<p className="text-muted-foreground mb-8">
					매일 {DAILY_COUNT}문제, 꾸준히 실력을 쌓으세요.
				</p>

				<Card className="p-6 text-center">
					<Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
					<p className="text-lg font-medium mb-2">
						오늘의 {questions.length}문제가 준비되었습니다
					</p>
					<p className="text-sm text-muted-foreground mb-6">
						복습 카드와 새 카드가 혼합되어 있습니다.
					</p>

					{streak > 0 && (
						<div className="flex items-center justify-center gap-2 mb-6">
							<Flame className="h-5 w-5 text-orange-500" />
							<span className="font-medium">{streak}일 연속 학습 중</span>
						</div>
					)}

					<Button
						onClick={() => setPhase('study')}
						size="lg"
						className="gap-2"
						disabled={questions.length === 0}
					>
						시작하기
					</Button>

					{questions.length === 0 && (
						<p className="text-sm text-muted-foreground mt-4">
							학습할 문제가 없습니다. 먼저 레퍼런스에서 질문을 확인해보세요.
						</p>
					)}
				</Card>
			</div>
		);
	}

	// ==================== DONE ====================
	if (phase === 'done') {
		return (
			<div className="container mx-auto max-w-2xl px-4 py-8">
				<div className="text-center mb-6">
					<Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
					<h1 className="text-3xl font-bold mb-2">챌린지 완료!</h1>

					{streak > 0 && (
						<div className="flex items-center justify-center gap-2 mt-4">
							<Flame className="h-6 w-6 text-orange-500" />
							<span className="text-xl font-bold">{streak}일 연속 학습!</span>
						</div>
					)}
				</div>

				<ResultScoreCard resultCounts={resultCounts} totalCount={results.length} />

				<div className="flex gap-3">
					<Link href="/learn/flashcard" className="flex-1">
						<Button variant="outline" className="w-full gap-2">
							플래시카드로 더 학습
							<ArrowRight className="h-4 w-4" />
						</Button>
					</Link>
					<Link href="/mypage/progress" className="flex-1">
						<Button variant="ghost" className="w-full gap-2">
							학습 현황 보기
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	// ==================== STUDY ====================
	return (
		<StudyCardView
			currentIndex={currentIndex}
			totalCount={questions.length}
			currentQuestion={currentQuestion}
			isFlipped={isFlipped}
			onFlip={() => setIsFlipped(true)}
			progressPercent={progressPercent}
			isNewCard={isNewCard}
			currentProgress={null}
			onRate={handleRate}
		/>
	);
}
