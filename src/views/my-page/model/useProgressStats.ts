'use client';

import { useState, useEffect } from 'react';
import { getAllCategories, getAllQuestions } from '@entities/question';
import type { Category } from '@entities/question';
import { getProgressByCategory, getLocalProgress, getStudyHeatmap, getCurrentStreak, getDueCardCount } from '@entities/progress';

interface OverallStats {
	total: number;
	mastered: number;
	learning: number;
	unseen: number;
}

type CategoryStats = Record<string, { mastered: number; learning: number; unseen: number }>;

/**
 * 전체 학습 현황(통계, 카테고리별 진도, 히트맵, 스트릭)을 로드한다.
 * localStorage는 한 번만 파싱하여 각 파생 값에 공유한다.
 */
export function useProgressStats() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [stats, setStats] = useState<OverallStats>({ total: 0, mastered: 0, learning: 0, unseen: 0 });
	const [categoryStats, setCategoryStats] = useState<CategoryStats>({});
	const [heatmap, setHeatmap] = useState<Record<string, number>>({});
	const [streak, setStreak] = useState(0);
	const [dueCount, setDueCount] = useState(0);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			const progress = getLocalProgress();
			const hm = getStudyHeatmap(progress);
			setHeatmap(hm);
			setStreak(getCurrentStreak(hm));
			setDueCount(getDueCardCount(progress));

			const [cats, allQuestions] = await Promise.all([getAllCategories(), getAllQuestions()]);
			if (cancelled) return;
			setCategories(cats);

			const questionIdsByCategory = new Map<string, string[]>();
			for (const q of allQuestions) {
				const ids = questionIdsByCategory.get(q.category_id);
				if (ids) ids.push(q.id);
				else questionIdsByCategory.set(q.category_id, [q.id]);
			}

			let mastered = 0;
			let learning = 0;
			for (const p of Object.values(progress)) {
				if (p.status === 'mastered') mastered++;
				else if (p.status === 'learning') learning++;
			}
			setStats({ total: allQuestions.length, mastered, learning, unseen: allQuestions.length - mastered - learning });

			const catStats: CategoryStats = {};
			for (const cat of cats) {
				const questionIds = questionIdsByCategory.get(cat.id) ?? [];
				catStats[cat.id] = getProgressByCategory(questionIds, progress);
			}
			setCategoryStats(catStats);
		}

		load();
		return () => { cancelled = true; };
	}, []);

	const overallPercent = stats.total > 0
		? Math.round(((stats.mastered + stats.learning) / stats.total) * 100)
		: 0;

	return { categories, stats, categoryStats, heatmap, streak, dueCount, overallPercent };
}
