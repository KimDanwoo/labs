'use client';

import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/select';
import type { Category } from '@/entities/question';
import { Clock, Brain, Shuffle } from 'lucide-react';

type StudyMode = 'review' | 'new' | 'mixed';

interface FlashcardSetupProps {
	categories: Category[];
	isLoading: boolean;
	dueCount: number;
	studyMode: StudyMode;
	onStudyModeChange: (mode: StudyMode) => void;
	selectedCategory: string;
	onCategoryChange: (value: string) => void;
	questionCount: number;
	onQuestionCountChange: (count: number) => void;
	onStart: () => void;
}

export function FlashcardSetup({
	categories,
	isLoading,
	dueCount,
	studyMode,
	onStudyModeChange,
	selectedCategory,
	onCategoryChange,
	questionCount,
	onQuestionCountChange,
	onStart,
}: FlashcardSetupProps) {
	return (
		<div className="container mx-auto max-w-2xl px-4 py-8">
			<h1 className="text-3xl font-bold mb-2">플래시카드</h1>
			<p className="text-muted-foreground mb-8">
				간격 반복으로 장기 기억에 남기세요.
			</p>

			{dueCount > 0 && (
				<Card className="p-4 mb-6 border-yellow-500/30 bg-yellow-500/5">
					<div className="flex items-center gap-3">
						<Clock className="h-5 w-5 text-yellow-500 shrink-0" />
						<div>
							<p className="font-medium text-sm">
								오늘 복습할 카드가 {dueCount}개 있습니다
							</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								복습 카드를 먼저 학습하면 기억 유지에 효과적입니다.
							</p>
						</div>
					</div>
				</Card>
			)}

			<Card className="p-6 space-y-6">
				<div>
					<label className="text-sm font-medium mb-2 block">학습 모드</label>
					<div className="grid grid-cols-3 gap-2">
						<Button
							variant={studyMode === 'review' ? 'default' : 'outline'}
							size="sm"
							onClick={() => onStudyModeChange('review')}
							className="gap-1.5"
						>
							<Clock className="h-3.5 w-3.5" />
							복습
							{dueCount > 0 && (
								<Badge variant="secondary" className="text-xs ml-1 px-1.5">
									{dueCount}
								</Badge>
							)}
						</Button>
						<Button
							variant={studyMode === 'new' ? 'default' : 'outline'}
							size="sm"
							onClick={() => onStudyModeChange('new')}
							className="gap-1.5"
						>
							<Brain className="h-3.5 w-3.5" />
							새 카드
						</Button>
						<Button
							variant={studyMode === 'mixed' ? 'default' : 'outline'}
							size="sm"
							onClick={() => onStudyModeChange('mixed')}
							className="gap-1.5"
						>
							<Shuffle className="h-3.5 w-3.5" />
							혼합
						</Button>
					</div>
				</div>

				{studyMode !== 'review' && (
					<div>
						<label className="text-sm font-medium mb-2 block">카테고리</label>
						<Select value={selectedCategory} onValueChange={onCategoryChange} disabled={isLoading}>
							<SelectTrigger>
								<SelectValue placeholder={isLoading ? '카테고리 불러오는 중...' : '카테고리 선택'} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">전체 카테고리</SelectItem>
								{categories.map((cat) => (
									<SelectItem key={cat.id} value={cat.slug}>
										{cat.icon} {cat.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				<div>
					<label className="text-sm font-medium mb-2 block">문제 수</label>
					<div className="flex gap-2">
						{[5, 10, 20, 30].map((n) => (
							<Button
								key={n}
								variant={questionCount === n ? 'default' : 'outline'}
								size="sm"
								onClick={() => onQuestionCountChange(n)}
							>
								{n}문제
							</Button>
						))}
					</div>
				</div>

				<Button
					onClick={onStart}
					size="lg"
					className="w-full gap-2"
					disabled={isLoading || (studyMode === 'review' && dueCount === 0)}
				>
					<Shuffle className="h-4 w-4" />
					{studyMode === 'review' ? '복습 시작' : '학습 시작'}
				</Button>

				{studyMode === 'review' && dueCount === 0 && (
					<p className="text-sm text-muted-foreground text-center">
						오늘 복습할 카드가 없습니다. 새 카드를 학습해보세요.
					</p>
				)}
			</Card>

			<div className="mt-6 p-4 rounded-lg bg-muted/50">
				<p className="text-xs text-muted-foreground leading-relaxed">
					<strong>학습 방법:</strong> 질문을 보고 머릿속으로 답을 떠올린 뒤 카드를 뒤집으세요.
					정답과 비교해서 얼마나 잘 기억했는지 평가하면, 시스템이 최적의 복습 시점을 자동으로 계산합니다.
				</p>
			</div>
		</div>
	);
}
