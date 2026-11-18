'use client';

import type { Category } from '@entities/question';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';

import type { StudySettings } from '../../model/constants/study';
import { useStudySettingsForm } from '../../model/hooks/useStudySettingsForm';
import { CategoryField } from './CategoryField';
import { DifficultyField } from './DifficultyField';
import { styles } from './LearnSetup.styles';
import { OrderField } from './OrderField';

interface LearnSetupProps {
  categories: Category[];
  isLoadingCategories: boolean;
  initialSettings: StudySettings;
  isStarting: boolean;
  isEmpty: boolean;
  onStart: (settings: StudySettings) => void;
}

export function LearnSetup({
  categories,
  isLoadingCategories,
  initialSettings,
  isStarting,
  isEmpty,
  onStart,
}: LearnSetupProps) {
  const { settings, changeSettings, toggleDifficulty } = useStudySettingsForm(initialSettings);

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>학습</h1>
      <p className={styles.description}>질문을 보고 답을 먼저 적어본 뒤, 모범 답변과 비교하세요.</p>

      <Card className={styles.card}>
        <CategoryField
          categories={categories}
          value={settings.categorySlug}
          isLoading={isLoadingCategories}
          onChange={(categorySlug) => changeSettings({ categorySlug })}
        />
        <OrderField value={settings.order} onChange={(order) => changeSettings({ order })} />
        <DifficultyField
          selected={settings.difficulties}
          onToggle={toggleDifficulty}
          onClear={() => changeSettings({ difficulties: [] })}
        />

        <Button
          onClick={() => onStart(settings)}
          size="lg"
          className={styles.start}
          disabled={isLoadingCategories || isStarting}
        >
          {isStarting ? '문제 불러오는 중...' : '학습 시작'}
        </Button>

        {isEmpty && <p className={styles.empty}>조건에 맞는 문제가 없습니다.</p>}
      </Card>

      <div className={styles.tip}>
        <p className={styles.tipText}>
          <strong className={styles.tipLabel}>학습 방법:</strong> 답을 보기 전에 떠오르는 내용을 먼저 적어보세요. 읽기만
          하는 것보다 직접 인출해보는 쪽이 기억에 훨씬 오래 남습니다.
        </p>
      </div>
    </div>
  );
}
