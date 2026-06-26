'use client';

import { EQUIPMENT, type Exercise } from '@entities/exercise/model/types';
import { filterExercisesByMuscle } from '@features/routine-builder/model/lib';
import { MUSCLE_GROUP, type MuscleGroup } from '@shared/training';
import { Badge } from '@ui/react';
import { useState } from 'react';

type MuscleFilter = MuscleGroup | 'all';

type Props = {
  exercises: readonly Exercise[];
  selectedIds: readonly string[];
  onToggle: (exerciseId: string) => void;
};

export function ExercisePicker({ exercises, selectedIds, onToggle }: Props) {
  const [activeFilter, setActiveFilter] = useState<MuscleFilter>('all');
  const filtered = filterExercisesByMuscle(exercises, activeFilter);

  const muscleGroups = Object.keys(MUSCLE_GROUP) as MuscleGroup[];

  return (
    <div className="flex flex-col gap-md">
      {/* 근육 그룹 필터 칩 — 가로 스크롤 대신 줄바꿈으로 한눈에(스크롤바·드래그 불필요) */}
      <div className="flex flex-wrap gap-xs">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={[
            'shrink-0 rounded-full px-lg py-xs text-sm font-medium transition-colors',
            activeFilter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-glass border border-card-border text-muted',
          ].join(' ')}
        >
          전체
        </button>
        {muscleGroups.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setActiveFilter(m)}
            className={[
              'shrink-0 rounded-full px-lg py-xs text-sm font-medium transition-colors',
              activeFilter === m
                ? 'bg-primary text-primary-foreground'
                : 'bg-glass border border-card-border text-muted',
            ].join(' ')}
          >
            {MUSCLE_GROUP[m]}
          </button>
        ))}
      </div>

      {/* 종목 목록 — 페이지와 단일 스크롤(내부 중첩 스크롤 없음) */}
      <div className="flex flex-col gap-xs">
        {filtered.map((exercise) => {
          const isSelected = selectedIds.includes(exercise.id);
          return (
            <button
              key={exercise.id}
              type="button"
              onClick={() => onToggle(exercise.id)}
              className={[
                'flex items-center justify-between rounded-lg border p-lg text-left transition-colors',
                isSelected ? 'border-primary bg-primary-subtle' : 'border-card-border bg-glass',
              ].join(' ')}
            >
              <div className="flex flex-col gap-xs">
                <span className={['text-base font-medium', isSelected ? 'text-primary' : 'text-foreground'].join(' ')}>
                  {exercise.nameKo}
                </span>
                <Badge tone={isSelected ? 'primary' : 'secondary'}>{EQUIPMENT[exercise.equipment]}</Badge>
              </div>
              <span
                className={[
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  isSelected ? 'bg-primary text-primary-foreground' : 'border border-card-border text-muted',
                ].join(' ')}
              >
                {isSelected ? '✓' : '+'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
