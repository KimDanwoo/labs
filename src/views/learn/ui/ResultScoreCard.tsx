'use client';

import { Card } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';

interface ResultScoreCardProps {
	resultCounts: { again: number; hard: number; good: number; easy: number };
	totalCount: number;
}

export function ResultScoreCard({ resultCounts, totalCount }: ResultScoreCardProps) {
	const correctRate = totalCount > 0
		? Math.round(((resultCounts.good + resultCounts.easy) / totalCount) * 100)
		: 0;

	return (
		<Card className="p-6 mb-6">
			<div className="grid grid-cols-4 gap-3 text-center">
				<div className="p-3 rounded-lg bg-red-500/10">
					<div className="text-2xl font-bold text-red-500">{resultCounts.again}</div>
					<div className="text-xs text-muted-foreground mt-1">다시</div>
				</div>
				<div className="p-3 rounded-lg bg-orange-500/10">
					<div className="text-2xl font-bold text-orange-500">{resultCounts.hard}</div>
					<div className="text-xs text-muted-foreground mt-1">어려움</div>
				</div>
				<div className="p-3 rounded-lg bg-green-500/10">
					<div className="text-2xl font-bold text-green-500">{resultCounts.good}</div>
					<div className="text-xs text-muted-foreground mt-1">좋음</div>
				</div>
				<div className="p-3 rounded-lg bg-blue-500/10">
					<div className="text-2xl font-bold text-blue-500">{resultCounts.easy}</div>
					<div className="text-xs text-muted-foreground mt-1">쉬움</div>
				</div>
			</div>

			{totalCount > 0 && (
				<div className="mt-4">
					<Progress value={correctRate} className="h-3" />
					<p className="text-sm text-muted-foreground mt-2 text-center">
						정답률: {correctRate}%
					</p>
				</div>
			)}
		</Card>
	);
}
