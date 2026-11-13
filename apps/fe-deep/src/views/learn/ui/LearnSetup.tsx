'use client';

import { DIFFICULTY_CONFIG, DIFFICULTY_VALUES, type Category, type Difficulty } from '@entities/question';
import { Button, Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/react';
import { ArrowDownAZ, Shuffle, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { ALL_CATEGORIES, STUDY_ORDER, type StudyOrder, type StudySettings } from '../model/constants/study';

const ORDER_OPTIONS: { value: StudyOrder; label: string; Icon: LucideIcon }[] = [
  { value: STUDY_ORDER.sequential, label: '순서대로', Icon: ArrowDownAZ },
  { value: STUDY_ORDER.random, label: '무작위', Icon: Shuffle },
];

const selectedVariant = (isSelected: boolean) => (isSelected ? 'default' : 'outline');

type LearnSetupProps = {
  categories: Category[];
  isLoadingCategories: boolean;
  initialSettings: StudySettings;
  isStarting: boolean;
  isEmpty: boolean;
  onStart: (settings: StudySettings) => void;
};

export function LearnSetup({
  categories,
  isLoadingCategories,
  initialSettings,
  isStarting,
  isEmpty,
  onStart,
}: LearnSetupProps) {
  const [settings, setSettings] = useState(initialSettings);
  const { categorySlug, order, difficulties } = settings;
  const change = (patch: Partial<StudySettings>) => setSettings({ ...settings, ...patch });

  const toggleDifficulty = (value: Difficulty) =>
    change({
      difficulties: difficulties.includes(value) ? difficulties.filter((d) => d !== value) : [...difficulties, value],
    });

  return (
    <div className="container mx-auto max-w-168 px-4 py-8 sm:py-12 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight mb-2">학습</h1>
      <p className="text-muted-foreground mb-8">질문을 보고 답을 먼저 적어본 뒤, 모범 답변과 비교하세요.</p>

      <Card className="p-6 space-y-6">
        <div>
          <label className="text-sm font-normal mb-3 block">카테고리</label>
          <Select
            value={categorySlug}
            onValueChange={(value) => change({ categorySlug: value })}
            disabled={isLoadingCategories}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoadingCategories ? '카테고리 불러오는 중...' : '카테고리 선택'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>전체 카테고리</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.icon} {category.title}
                  {category.question_count !== undefined &&
                    category.question_count !== null &&
                    ` (${category.question_count})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-normal mb-3 block">순서</label>
          <div className="grid grid-cols-2 gap-1.5">
            {ORDER_OPTIONS.map(({ value, label, Icon }) => (
              <Button
                key={value}
                variant={selectedVariant(order === value)}
                size="sm"
                onClick={() => change({ order: value })}
                className="gap-1.5 transition-all duration-200"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-normal mb-3 block">난이도</label>
          <div className="grid grid-cols-4 gap-1.5">
            <Button
              variant={selectedVariant(difficulties.length === 0)}
              size="sm"
              onClick={() => change({ difficulties: [] })}
              className="transition-all duration-200"
            >
              전체
            </Button>
            {DIFFICULTY_VALUES.map((value) => (
              <Button
                key={value}
                variant={selectedVariant(difficulties.includes(value))}
                size="sm"
                onClick={() => toggleDifficulty(value)}
                className="transition-all duration-200"
              >
                {DIFFICULTY_CONFIG[value].label}
              </Button>
            ))}
          </div>
        </div>

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
    </div>
  );
}
