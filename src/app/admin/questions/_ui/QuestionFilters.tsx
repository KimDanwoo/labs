'use client';

import { Input } from '@/shared/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/select';
import type { Category } from '@/entities/question/model';

interface QuestionFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	categoryFilter: string;
	onCategoryFilterChange: (value: string) => void;
	difficultyFilter: string;
	onDifficultyFilterChange: (value: string) => void;
	categories: Category[];
}

export function QuestionFilters({
	search,
	onSearchChange,
	categoryFilter,
	onCategoryFilterChange,
	difficultyFilter,
	onDifficultyFilterChange,
	categories,
}: QuestionFiltersProps) {
	return (
		<div className="flex flex-wrap gap-3">
			<Input
				placeholder="질문 검색..."
				value={search}
				onChange={(e) => onSearchChange(e.target.value)}
				className="max-w-xs"
			/>
			<Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
				<SelectTrigger className="w-44">
					<SelectValue placeholder="카테고리" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">전체 카테고리</SelectItem>
					{categories.map((c) => (
						<SelectItem key={c.id} value={c.id}>
							{c.icon} {c.title}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select value={difficultyFilter} onValueChange={onDifficultyFilterChange}>
				<SelectTrigger className="w-32">
					<SelectValue placeholder="난이도" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">전체</SelectItem>
					<SelectItem value="easy">Easy</SelectItem>
					<SelectItem value="medium">Medium</SelectItem>
					<SelectItem value="hard">Hard</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
