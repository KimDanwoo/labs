'use client';

import type { Category } from '@entities/question';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { PageContainer } from '@shared/ui/PageContainer';
import { PageTitle } from '@shared/ui/PageTitle';

import type { StudySettings } from '../../model/constants/study';
import { useStudySettingsForm } from '../../model/hooks/useStudySettingsForm';
import { CategoryField } from './CategoryField';
import { DifficultyField } from './DifficultyField';
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
    <PageContainer width="narrow" enter="fade">
      <PageTitle className="mb-2">학습</PageTitle>
      <p className="text-muted-foreground mb-8">질문을 보고 답을 먼저 적어본 뒤, 모범 답변과 비교하세요.</p>

      <Card className="p-6 space-y-6">
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
          className="w-full gap-2 h-12 shadow-md hover:shadow-lg transition-all duration-300"
          disabled={isLoadingCategories || isStarting}
        >
          {isStarting ? '문제 불러오는 중...' : '학습 시작'}
        </Button>

        {isEmpty && <p className="text-sm text-muted-foreground text-center">조건에 맞는 문제가 없습니다.</p>}
      </Card>

      <div className="mt-6 p-4 rounded-xl bg-muted/40 border border-border/50">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground/70">학습 방법:</strong> 답을 보기 전에 떠오르는 내용을 먼저 적어보세요.
          읽기만 하는 것보다 직접 인출해보는 쪽이 기억에 훨씬 오래 남습니다.
        </p>
      </div>
    </PageContainer>
  );
}
