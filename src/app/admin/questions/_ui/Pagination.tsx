'use client';

import { Button } from '@/shared/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
	if (totalPages <= 1) return null;

	const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
		.filter((p) => {
			if (p === 1 || p === totalPages) return true;
			return Math.abs(p - page) <= 2;
		})
		.reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
			if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
				acc.push('ellipsis');
			}
			acc.push(p);
			return acc;
		}, []);

	return (
		<div className="flex items-center justify-center gap-2">
			<Button
				variant="outline"
				size="sm"
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
			>
				<ChevronLeft className="size-4" />
			</Button>
			{pages.map((item, idx) =>
				item === 'ellipsis' ? (
					<span key={`e-${idx}`} className="px-1 text-muted-foreground">
						...
					</span>
				) : (
					<Button
						key={item}
						variant={page === item ? 'default' : 'outline'}
						size="sm"
						className="min-w-8"
						onClick={() => onPageChange(item)}
					>
						{item}
					</Button>
				)
			)}
			<Button
				variant="outline"
				size="sm"
				disabled={page >= totalPages}
				onClick={() => onPageChange(page + 1)}
			>
				<ChevronRight className="size-4" />
			</Button>
		</div>
	);
}
