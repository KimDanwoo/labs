'use client';

import { Card } from '@shared/ui/Card';
import { PageContainer } from '@shared/ui/PageContainer';
import { PageTitle } from '@shared/ui/PageTitle';

import { EMPTY_CATEGORY_STATS, NOT_LOADED, STAT_CARDS } from '../../config/progress';
import { useProgressStats } from '../../model/hooks/useProgressStats';
import { CategoryProgressCard } from './CategoryProgressCard';
import { OverallProgressCard } from './OverallProgressCard';
import { StatCard } from './StatCard';
import { StreakCard } from './StreakCard';
import { StudyHeatmap } from './StudyHeatmap';

export function ProgressPage() {
  const { categories, stats, categoryStats, heatmap, streak, overallPercent } = useProgressStats();

  return (
    <PageContainer width="medium" enter="fade">
      <PageTitle className="mb-2">학습 현황</PageTitle>
      <p className="text-muted-foreground mb-8">전체 학습 진도를 확인하세요.</p>

      <StreakCard streak={streak} />

      <Card className="mb-8 shadow-sm">
        <Card.Content className="p-6">
          <h2 className="text-sm font-normal mb-4">학습 기록</h2>
          <StudyHeatmap heatmap={heatmap} />
        </Card.Content>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger-children">
        {STAT_CARDS.map((config) => (
          <StatCard key={config.key} config={config} value={stats?.[config.key] ?? NOT_LOADED} />
        ))}
      </div>

      <OverallProgressCard isLoaded={Boolean(stats)} percent={overallPercent} />

      <h2 className="text-xl font-bold tracking-tight mb-4">카테고리별 진도</h2>
      <div className="space-y-3">
        {categories.map((category) => (
          <CategoryProgressCard
            key={category.id}
            category={category}
            progress={categoryStats[category.id] ?? EMPTY_CATEGORY_STATS}
          />
        ))}
      </div>
    </PageContainer>
  );
}
