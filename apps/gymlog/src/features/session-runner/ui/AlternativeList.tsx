'use client';

import { getExerciseById } from '@entities/exercise/model/constants';
import { EQUIPMENT } from '@entities/exercise/model/types';
import { Badge, Button } from '@ui/react';

type AlternativeListProps = {
  alternativeIds: readonly string[];
  onSelect: (alternativeId: string) => void;
};

export function AlternativeList({ alternativeIds, onSelect }: AlternativeListProps) {
  if (alternativeIds.length === 0) {
    return <p className="text-sm text-muted-foreground">대체 운동이 없습니다.</p>;
  }

  return (
    <ul className="flex flex-col gap-sm">
      {alternativeIds.map((altId) => {
        const exercise = getExerciseById(altId);
        if (!exercise) return null;

        return (
          <li key={altId}>
            <Button variant="outline" className="h-14 w-full justify-between px-lg" onClick={() => onSelect(altId)}>
              <span className="font-medium text-foreground">{exercise.nameKo}</span>
              <Badge variant="secondary">{EQUIPMENT[exercise.equipment]}</Badge>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
