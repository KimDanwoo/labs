'use client';

import { Card } from '@shared/ui/Card';

import { EMPTY_CATEGORY_STATS, NOT_LOADED, STAT_CARDS } from '../../config/progress';
import { useProgressStats } from '../../model/hooks/useProgressStats';
import { CategoryProgressCard } from './CategoryProgressCard';
import { OverallProgressCard } from './OverallProgressCard';
import { styles } from './ProgressPage.styles';
import { StatCard } from './StatCard';
import { StreakCard } from './StreakCard';
import { StudyHeatmap } from './StudyHeatmap';

export function ProgressPage() {
  const { categories, stats, categoryStats, heatmap, streak, overallPercent } = useProgressStats();

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>학습 현황</h1>
      <p className={styles.description}>전체 학습 진도를 확인하세요.</p>

      <StreakCard streak={streak} />

      <Card className={styles.heatmapCard}>
        <Card.Content className={styles.cardContent}>
          <h2 className={styles.heatmapTitle}>학습 기록</h2>
          <StudyHeatmap heatmap={heatmap} />
        </Card.Content>
      </Card>

      <div className={styles.statGrid}>
        {STAT_CARDS.map((config) => (
          <StatCard key={config.key} config={config} value={stats?.[config.key] ?? NOT_LOADED} />
        ))}
      </div>

      <OverallProgressCard isLoaded={Boolean(stats)} percent={overallPercent} />

      <h2 className={styles.categoryTitle}>카테고리별 진도</h2>
      <div className={styles.categoryList}>
        {categories.map((category) => (
          <CategoryProgressCard
            key={category.id}
            category={category}
            progress={categoryStats[category.id] ?? EMPTY_CATEGORY_STATS}
          />
        ))}
      </div>
    </div>
  );
}
