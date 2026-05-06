'use client';

import Link from 'next/link';
import { Button, Badge, Checkbox } from '@shared/ui';
import { DifficultyBadge } from '@entities/question/ui';
import type { Question, Category } from '@entities/question/model';
import { Pencil, Trash2, BookOpen, Layers } from 'lucide-react';

interface QuestionTableProps {
	questions: Question[];
	categoryMap: Map<string, Category>;
	loading: boolean;
	selectedIds: Set<string>;
	onSelectionChange: (ids: Set<string>) => void;
	onDelete: (id: string) => void;
}

export function QuestionTable({
	questions,
	categoryMap,
	loading,
	selectedIds,
	onSelectionChange,
	onDelete,
}: QuestionTableProps) {
	const allSelected =
		questions.length > 0 && questions.every((q) => selectedIds.has(q.id));

	function toggleAll() {
		if (allSelected) {
			onSelectionChange(new Set());
		} else {
			onSelectionChange(new Set(questions.map((q) => q.id)));
		}
	}

	function toggleOne(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		onSelectionChange(next);
	}

	if (loading) {
		return (
			<div className="p-8 text-center text-muted-foreground border rounded-lg">
				불러오는 중...
			</div>
		);
	}

	if (questions.length === 0) {
		return (
			<div className="p-8 text-center text-muted-foreground border rounded-lg">
				결과가 없습니다.
			</div>
		);
	}

	return (
		<>
			{/* Select all */}
			<div className="flex items-center gap-2 px-1 mb-2">
				<Checkbox
					checked={allSelected}
					onCheckedChange={toggleAll}
					aria-label="전체 선택"
				/>
				<span className="text-sm text-muted-foreground">전체 선택</span>
			</div>

			{/* Desktop table */}
			<div className="hidden md:block overflow-x-auto border rounded-lg">
				<table className="w-full text-sm">
					<thead className="bg-muted/50">
						<tr>
							<th className="p-3 w-10">
								<Checkbox
									checked={allSelected}
									onCheckedChange={toggleAll}
									aria-label="전체 선택"
								/>
							</th>
							<th className="text-left p-3 font-medium">카테고리</th>
							<th className="text-left p-3 font-medium">질문</th>
							<th className="text-left p-3 font-medium">소분류</th>
							<th className="text-left p-3 font-medium">난이도</th>
							<th className="text-left p-3 font-medium">노출</th>
							<th className="text-left p-3 font-medium">태그</th>
							<th className="text-right p-3 font-medium">액션</th>
						</tr>
					</thead>
					<tbody className="divide-y">
						{questions.map((q) => {
							const cat = categoryMap.get(q.category_id);
							return (
								<tr key={q.id} className="hover:bg-muted/30">
									<td className="p-3">
										<Checkbox
											checked={selectedIds.has(q.id)}
											onCheckedChange={() => toggleOne(q.id)}
											aria-label={`${q.question} 선택`}
										/>
									</td>
									<td className="p-3 whitespace-nowrap">
										{cat ? `${cat.icon} ${cat.title}` : q.category_id}
									</td>
									<td className="p-3 max-w-md">
										<span className="line-clamp-1">{q.question}</span>
									</td>
									<td className="p-3 whitespace-nowrap text-muted-foreground">
										{q.sub_category}
									</td>
									<td className="p-3">
										<DifficultyBadge difficulty={q.difficulty} />
									</td>
									<td className="p-3">
										<div className="flex gap-1">
											<Badge
												variant={q.show_in_daily ? 'default' : 'outline'}
												className="text-xs gap-0.5"
											>
												<BookOpen className="size-3" />
												학습
											</Badge>
											<Badge
												variant={q.show_in_flashcard ? 'default' : 'outline'}
												className="text-xs gap-0.5"
											>
												<Layers className="size-3" />
												카드
											</Badge>
										</div>
									</td>
									<td className="p-3">
										<div className="flex flex-wrap gap-1">
											{q.tags.slice(0, 3).map((tag) => (
												<Badge key={tag} variant="secondary" className="text-xs">
													{tag}
												</Badge>
											))}
											{q.tags.length > 3 && (
												<Badge variant="outline" className="text-xs">
													+{q.tags.length - 3}
												</Badge>
											)}
										</div>
									</td>
									<td className="p-3 text-right whitespace-nowrap">
										<div className="flex justify-end gap-1">
											<Button variant="ghost" size="icon" asChild>
												<Link href={`/admin/questions/${q.id}`}>
													<Pencil className="size-4" />
												</Link>
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => onDelete(q.id)}
											>
												<Trash2 className="size-4 text-destructive" />
											</Button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Mobile card list */}
			<div className="md:hidden space-y-2">
				{questions.map((q) => {
					const cat = categoryMap.get(q.category_id);
					return (
						<div
							key={q.id}
							className={`border rounded-lg p-3 space-y-2 ${selectedIds.has(q.id) ? 'bg-muted/40 border-primary/30' : ''}`}
						>
							<div className="flex items-start gap-2">
								<Checkbox
									checked={selectedIds.has(q.id)}
									onCheckedChange={() => toggleOne(q.id)}
									className="mt-0.5"
									aria-label={`${q.question} 선택`}
								/>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium leading-snug line-clamp-2">
										{q.question}
									</p>
									<div className="flex items-center gap-2 mt-1.5 flex-wrap">
										{cat && (
											<span className="text-xs text-muted-foreground">
												{cat.icon} {cat.title}
											</span>
										)}
										{q.sub_category && (
											<span className="text-xs text-muted-foreground">
												· {q.sub_category}
											</span>
										)}
										<DifficultyBadge difficulty={q.difficulty} />
									</div>
								</div>
							</div>

							<div className="flex items-center justify-between">
								<div className="flex gap-1">
									<Badge
										variant={q.show_in_daily ? 'default' : 'outline'}
										className="text-xs gap-0.5"
									>
										<BookOpen className="size-3" />
										학습
									</Badge>
									<Badge
										variant={q.show_in_flashcard ? 'default' : 'outline'}
										className="text-xs gap-0.5"
									>
										<Layers className="size-3" />
										카드
									</Badge>
								</div>
								<div className="flex gap-1">
									<Button variant="ghost" size="icon" className="size-8" asChild>
										<Link href={`/admin/questions/${q.id}`}>
											<Pencil className="size-3.5" />
										</Link>
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="size-8"
										onClick={() => onDelete(q.id)}
									>
										<Trash2 className="size-3.5 text-destructive" />
									</Button>
								</div>
							</div>

							{q.tags.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{q.tags.slice(0, 3).map((tag) => (
										<Badge key={tag} variant="secondary" className="text-xs">
											{tag}
										</Badge>
									))}
									{q.tags.length > 3 && (
										<Badge variant="outline" className="text-xs">
											+{q.tags.length - 3}
										</Badge>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</>
	);
}
