'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { MarkdownRenderer } from '@/shared/ui/MarkdownRenderer';
import { DifficultyBadge } from '@/entities/question/ui/DifficultyBadge';
import type { Question } from '@/entities/question';
import type { ReviewRating, UserProgress } from '@/entities/progress';
import { RATING_CONFIG } from '@/entities/progress';
import { Eye } from 'lucide-react';

interface StudyCardViewProps {
	currentIndex: number;
	totalCount: number;
	currentQuestion: Question | undefined;
	isFlipped: boolean;
	onFlip: () => void;
	progressPercent: number;
	isNewCard: boolean;
	currentProgress: UserProgress | null;
	onRate: (rating: ReviewRating) => void;
	/** 우측 상단에 렌더링할 액션 (종료 버튼 등) */
	headerAction?: React.ReactNode;
	/** 힌트 텍스트 (기본: "Space로 뒤집기") */
	flipHint?: string;
}

export function StudyCardView({
	currentIndex,
	totalCount,
	currentQuestion,
	isFlipped,
	onFlip,
	progressPercent,
	isNewCard,
	currentProgress,
	onRate,
	headerAction,
	flipHint = 'Space로 뒤집기',
}: StudyCardViewProps) {
	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			{/* Progress bar */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">
							{currentIndex + 1} / {totalCount}
						</span>
						{isNewCard && (
							<Badge variant="secondary" className="text-xs">NEW</Badge>
						)}
					</div>
					<div className="flex items-center gap-2">
						{!isFlipped && (
							<span className="text-xs text-muted-foreground">
								{flipHint}
							</span>
						)}
						{isFlipped && (
							<span className="text-xs text-muted-foreground">
								1~4로 평가
							</span>
						)}
						{headerAction}
					</div>
				</div>
				<Progress value={progressPercent} className="h-2" />
			</div>

			{/* Card */}
			<AnimatePresence mode="wait">
				<motion.div
					key={currentIndex}
					initial={{ opacity: 0, x: 50 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: -50 }}
					transition={{ duration: 0.2 }}
				>
					<Card className="min-h-[300px] p-6 relative">
						{/* Meta */}
						<div className="flex items-center gap-2 mb-4">
							<DifficultyBadge difficulty={currentQuestion?.difficulty ?? 'easy'} />
							{currentQuestion?.sub_category && (
								<Badge variant="secondary" className="text-xs">
									{currentQuestion.sub_category}
								</Badge>
							)}
							{currentProgress && (
								<span className="text-xs text-muted-foreground ml-auto">
									간격: {currentProgress.interval}일
								</span>
							)}
						</div>

						{/* Question */}
						<div className="flex flex-col items-center justify-center min-h-[120px] mb-4">
							<p className="text-lg font-medium text-center leading-relaxed">
								{currentQuestion?.question}
							</p>
						</div>

						{/* Answer or prompt */}
						{!isFlipped ? (
							<div className="text-center">
								<p className="text-sm text-muted-foreground mb-4">
									먼저 답을 떠올려 보세요
								</p>
								<Button
									variant="outline"
									size="lg"
									onClick={onFlip}
									className="gap-2"
								>
									<Eye className="h-4 w-4" />
									답변 확인
								</Button>
							</div>
						) : (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.2 }}
							>
								<div className="border-t pt-4">
									<MarkdownRenderer content={currentQuestion?.answer ?? ''} />
								</div>
							</motion.div>
						)}
					</Card>
				</motion.div>
			</AnimatePresence>

			{/* Rating buttons */}
			{isFlipped && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.15, delay: 0.1 }}
					className="mt-4"
				>
					<p className="text-xs text-muted-foreground text-center mb-3">
						얼마나 잘 기억했나요? (키보드: 1~4)
					</p>
					<div className="grid grid-cols-4 gap-2">
						{RATING_CONFIG.map(({ rating, label, color, bgColor }, i) => (
							<Button
								key={rating}
								variant="outline"
								size="lg"
								className={`flex-col h-auto py-3 gap-1 ${color} ${bgColor}`}
								onClick={() => onRate(rating)}
							>
								<span className="text-sm font-medium">{label}</span>
								<span className="text-xs opacity-60">{i + 1}</span>
							</Button>
						))}
					</div>
				</motion.div>
			)}
		</div>
	);
}
