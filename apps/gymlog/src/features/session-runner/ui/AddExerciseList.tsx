'use client';

import { EXERCISES } from '@entities/exercise/model/constants';
import { EQUIPMENT } from '@entities/exercise/model/types';
import { MUSCLE_GROUP, type MuscleGroup } from '@shared/training';
import { Badge } from '@ui/react';
import { useMemo, useState } from 'react';

type AddExerciseListProps = {
  onAdd: (exerciseId: string) => void;
};

type Filter = MuscleGroup | 'all';

const MUSCLE_OPTIONS = Object.keys(MUSCLE_GROUP) as MuscleGroup[];

export function AddExerciseList({ onAdd }: AddExerciseListProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const normalized = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      EXERCISES.filter((exercise) => {
        const byMuscle = filter === 'all' || exercise.primaryMuscle === filter;
        const byQuery =
          normalized === '' ||
          exercise.nameKo.toLowerCase().includes(normalized) ||
          exercise.nameEn.toLowerCase().includes(normalized);
        return byMuscle && byQuery;
      }),
    [filter, normalized],
  );

  const chip = (active: boolean): string =>
    active
      ? 'bg-primary text-primary-foreground'
      : 'border border-card-border bg-glass text-foreground hover:bg-primary-subtle';

  return (
    <div className="flex flex-col gap-md rounded-lg border border-card-border bg-glass p-lg">
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="운동 검색 (예: 벤치프레스, squat)"
        className="h-11 w-full rounded-md border border-card-border bg-background px-md text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
      />

      <div className="flex flex-wrap gap-sm">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`h-9 rounded-full px-md text-sm font-medium ${chip(filter === 'all')}`}
        >
          전체
        </button>
        {MUSCLE_OPTIONS.map((muscle) => (
          <button
            key={muscle}
            type="button"
            onClick={() => setFilter(muscle)}
            className={`h-9 rounded-full px-md text-sm font-medium ${chip(filter === muscle)}`}
          >
            {MUSCLE_GROUP[muscle]}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="py-md text-center text-sm text-muted">검색 결과가 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-sm">
          {results.map((exercise) => (
            <li key={exercise.id}>
              <button
                type="button"
                onClick={() => onAdd(exercise.id)}
                className="flex w-full items-center justify-between rounded-md border border-card-border bg-glass px-lg py-md text-left hover:border-primary"
              >
                <span className="text-sm font-medium text-foreground">{exercise.nameKo}</span>
                <Badge tone="secondary">{EQUIPMENT[exercise.equipment]}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
