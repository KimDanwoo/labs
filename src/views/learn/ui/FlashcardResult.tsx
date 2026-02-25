'use client';

import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { getDueCardCount } from '@/entities/progress';
import { RotateCcw, ArrowRight } from 'lucide-react';
import { ResultScoreCard } from './ResultScoreCard';

interface FlashcardResultProps {
	resultCounts: { again: number; hard: number; good: number; easy: number };
	totalCount: number;
	onRetryFailed: () => void;
	onRestart: () => void;
	onBackToSetup: () => void;
}

export function FlashcardResult({
	resultCounts,
	totalCount,
	onRetryFailed,
	onRestart,
	onBackToSetup,
}: FlashcardResultProps) {
	const newDueCount = getDueCardCount();

	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<h1 className="text-3xl font-bold mb-2">학습 완료!</h1>
			<p className="text-muted-foreground mb-8">
				총 {totalCount}문제를 학습했습니다.
			</p>

			<ResultScoreCard resultCounts={resultCounts} totalCount={totalCount} />

			{resultCounts.again > 0 && (
				<p className="text-sm text-muted-foreground mt-3 mb-6 text-center">
					&quot;다시&quot;로 표시한 {resultCounts.again}개 카드는 내일 다시 나타납니다.
				</p>
			)}

			{newDueCount > 0 && (
				<Card className="p-4 mb-6 border-yellow-500/30 bg-yellow-500/5">
					<p className="text-sm text-center">
						아직 복습할 카드가 <strong>{newDueCount}개</strong> 남아있습니다.
					</p>
				</Card>
			)}

			<div className="flex flex-col gap-3">
				{resultCounts.again > 0 && (
					<Button
						onClick={onRetryFailed}
						variant="outline"
						size="lg"
						className="w-full gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
					>
						<RotateCcw className="h-4 w-4" />
						틀린 {resultCounts.again}개 다시 학습
					</Button>
				)}
				<div className="flex gap-3">
					<Button onClick={onRestart} className="flex-1 gap-2">
						<RotateCcw className="h-4 w-4" />
						다시 학습
					</Button>
					<Button
						variant="outline"
						onClick={onBackToSetup}
						className="flex-1 gap-2"
					>
						<ArrowRight className="h-4 w-4" />
						설정으로
					</Button>
				</div>
			</div>
		</div>
	);
}
