'use client';

import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Checkbox } from '@/shared/ui/checkbox';
import { DifficultyBadge } from '@/entities/question/ui/DifficultyBadge';
import type { Question, Category } from '@/entities/question/model';
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

	return (
		<div className="overflow-x-auto border rounded-lg">
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
					{loading ? (
						<tr>
							<td colSpan={8} className="p-8 text-center text-muted-foreground">
								불러오는 중...
							</td>
						</tr>
					) : questions.length === 0 ? (
						<tr>
							<td colSpan={8} className="p-8 text-center text-muted-foreground">
								결과가 없습니다.
							</td>
						</tr>
					) : (
						questions.map((q) => {
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
						})
					)}
				</tbody>
			</table>
		</div>
	);
}
