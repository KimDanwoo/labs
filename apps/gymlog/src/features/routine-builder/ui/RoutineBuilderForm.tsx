'use client';

import { EXERCISES, getExerciseById } from '@entities/exercise/model/constants';
import { ROUTINE_SOURCE, type Routine } from '@entities/routine/model/types';
import { type Goal } from '@shared/training';
import { Button, Card } from '@ui/react';
import { useState } from 'react';
import { ExercisePicker } from './ExercisePicker';
import { GoalPicker } from './GoalPicker';
import { SelectedExerciseList } from './SelectedExerciseList';

type RoutineBuilderFormProps = {
  initialRoutine: Routine | null;
  onSubmit: (routine: Routine, start: boolean) => void;
  // 관리자 공용 루틴 편집 등 '시작'이 의미 없는 맥락에서 시작 버튼을 숨긴다.
  hideStart?: boolean;
};

export function RoutineBuilderForm({ initialRoutine, onSubmit, hideStart }: RoutineBuilderFormProps) {
  const [name, setName] = useState(initialRoutine?.name ?? '');
  const [goal, setGoal] = useState<Goal>(initialRoutine?.goal ?? 'hypertrophy');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialRoutine?.items.map((item) => item.exerciseId) ?? []);

  const handleToggle = (exerciseId: string) =>
    setSelectedIds((prev) =>
      prev.includes(exerciseId) ? prev.filter((id) => id !== exerciseId) : [...prev, exerciseId],
    );
  const handleRemove = (exerciseId: string) => setSelectedIds((prev) => prev.filter((id) => id !== exerciseId));
  const handleReorder = (from: number, to: number) =>
    setSelectedIds((prev) => {
      const list = [...prev];
      const [moved] = list.splice(from, 1);
      if (!moved) {
        return prev;
      }
      list.splice(to, 0, moved);
      return list;
    });

  const selectedExercises = selectedIds
    .map((id) => getExerciseById(id))
    .filter((exercise): exercise is NonNullable<ReturnType<typeof getExerciseById>> => exercise !== undefined);

  const buildRoutine = (): Routine => {
    const finalName = name.trim() || '내 루틴';
    return {
      id: initialRoutine?.id ?? crypto.randomUUID(),
      name: finalName,
      split: initialRoutine?.split ?? 'custom',
      dayLabel: finalName,
      goal,
      source: ROUTINE_SOURCE.custom,
      items: selectedIds.map((exerciseId, index) => ({ exerciseId, order: index + 1 })),
    };
  };

  const canSubmit = selectedIds.length > 0;
  const handleSave = () => canSubmit && onSubmit(buildRoutine(), false);
  const handleSaveAndStart = () => canSubmit && onSubmit(buildRoutine(), true);

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-sm">
        <span className="text-sm font-medium text-muted-foreground">루틴 이름</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="예: 나의 가슴 루틴"
          className="h-12 rounded-md border border-card-border bg-glass px-md text-base text-foreground outline-none focus:border-primary"
        />
      </div>

      <Card>
        <Card.Header>
          <Card.Title>목표</Card.Title>
        </Card.Header>
        <Card.Content>
          <GoalPicker goal={goal} onChange={setGoal} />
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>종목 선택</Card.Title>
        </Card.Header>
        <Card.Content>
          <ExercisePicker exercises={EXERCISES} selectedIds={selectedIds} onToggle={handleToggle} />
        </Card.Content>
      </Card>

      {selectedExercises.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>선택한 종목 ({selectedExercises.length})</Card.Title>
            <Card.Description>순서가 우선순위가 됩니다</Card.Description>
          </Card.Header>
          <Card.Content>
            <SelectedExerciseList
              selectedExercises={selectedExercises}
              onRemove={handleRemove}
              onReorder={handleReorder}
            />
          </Card.Content>
        </Card>
      )}

      <div className="sticky bottom-0 flex flex-col gap-sm bg-linear-to-t from-background py-lg">
        {!hideStart && (
          <Button className="h-14 w-full text-base font-semibold" disabled={!canSubmit} onClick={handleSaveAndStart}>
            저장하고 시작
          </Button>
        )}
        <Button
          variant={hideStart ? undefined : 'outline'}
          className={hideStart ? 'h-14 w-full text-base font-semibold' : 'h-12 w-full'}
          disabled={!canSubmit}
          onClick={handleSave}
        >
          {hideStart ? '저장' : '저장만 하기'}
        </Button>
      </div>
    </div>
  );
}
