'use client';

import { Card } from '@/shared/ui/Card';
import { Progress } from '@/shared/ui/Progress';

interface ResultScoreCardProps {
	resultCounts: { again: number; hard: number; good: number; easy: number };
	totalCount: number;
}

export function ResultScoreCard({ resultCounts, totalCount }: ResultScoreCardProps) {
	const correctRate = totalCount > 0
		? Math.round(((resultCounts.good + resultCounts.easy) / totalCount) * 100)
		: 0;

	return (
		<Card className="p-6 mb-6 shadow-sm">
			<div className="grid grid-cols-4 gap-3 text-center">
				<div className="p-3 rounded-xl bg-red-500/8 border border-red-500/10">
					<div className="text-2xl font-bold tabular-nums text-red-500">{resultCounts.again}</div>
					<div className="text-xs text-muted-foreground mt-1">다시</div>
				</div>
				<div className="p-3 rounded-xl bg-orange-500/8 border border-orange-500/10">
					<div className="text-2xl font-bold tabular-nums text-orange-500">{resultCounts.hard}</div>
					<div className="text-xs text-muted-foreground mt-1">어려움</div>
				</div>
				<div className="p-3 rounded-xl bg-green-500/8 border border-green-500/10">
					<div className="text-2xl font-bold tabular-nums text-green-500">{resultCounts.good}</div>
					<div className="text-xs text-muted-foreground mt-1">좋음</div>
				</div>
				<div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/10">
					<div className="text-2xl font-bold tabular-nums text-blue-500">{resultCounts.easy}</div>
					<div className="text-xs text-muted-foreground mt-1">쉬움</div>
				</div>
			</div>

			{totalCount > 0 && (
				<div className="mt-5">
					<Progress value={correctRate} className="h-2" />
					<p className="text-sm text-muted-foreground mt-2 text-center tabular-nums">
						정답률: {correctRate}%
					</p>
				</div>
			)}
		</Card>
	);
}
