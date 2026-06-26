'use client';

import { EXERCISES } from '@entities/exercise/model/constants';
import { EQUIPMENT } from '@entities/exercise/model/types';
import { MUSCLE_GROUP, type MuscleGroup } from '@shared/training';
import { Badge } from '@ui/react';
import { useState } from 'react';

type AddExerciseListProps = {
  onAdd: (exerciseId: string) => void;
};

type Filter = MuscleGroup | 'all';

const MUSCLE_OPTIONS = Object.keys(MUSCLE_GROUP) as MuscleGroup[];

export function AddExerciseList({ onAdd }: AddExerciseListProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const exercises = filter === 'all' ? EXERCISES : EXERCISES.filter((exercise) => exercise.primaryMuscle === filter);

  const chip = (active: boolean): string =>
    active
      ? 'bg-primary text-primary-foreground'
      : 'border border-card-border bg-glass text-foreground hover:bg-primary-subtle';

  return (
    <div className="flex flex-col gap-md rounded-lg border border-card-border bg-glass p-lg">
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

      <ul className="flex flex-col gap-sm">
        {exercises.map((exercise) => (
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
    </div>
  );
}
