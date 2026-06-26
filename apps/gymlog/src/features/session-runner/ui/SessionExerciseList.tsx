'use client';

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getExerciseById } from '@entities/exercise/model/constants';
import { PERFORMANCE_STATUS, SET_STATUS, type ExercisePerformance } from '@entities/session/model/types';
import { MUSCLE_GROUP } from '@shared/training';
import { Badge, type BadgeTone } from '@ui/react';

type SessionExerciseListProps = {
  performances: ExercisePerformance[];
  onOpen: (index: number) => void;
  onRemove: (index: number) => void;
  onSwap: (index: number) => void;
  onReorder: (from: number, to: number) => void;
};

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  [PERFORMANCE_STATUS.done]: { label: '완료', tone: 'success' },
  [PERFORMANCE_STATUS.active]: { label: '진행 중', tone: 'info' },
  [PERFORMANCE_STATUS.pending]: { label: '대기', tone: 'secondary' },
};

const resolvedCount = (performance: ExercisePerformance): number =>
  performance.sets.filter((set) => set.status !== SET_STATUS.pending).length;

const ICON_BTN = 'flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-sm transition-colors';

type RowProps = {
  id: string;
  index: number;
  performance: ExercisePerformance;
  onOpen: (index: number) => void;
  onRemove: (index: number) => void;
  onSwap: (index: number) => void;
};

function SortableRow({ id, index, performance, onOpen, onRemove, onSwap }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const exercise = getExerciseById(performance.exerciseId);
  const status = STATUS[performance.status] ?? STATUS[PERFORMANCE_STATUS.pending];
  const isDone = performance.status === PERFORMANCE_STATUS.done;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-sm rounded-lg border border-card-border bg-glass p-md backdrop-blur-md ${
        isDragging ? 'shadow-glow' : ''
      } ${isDone ? 'opacity-70' : ''}`}
    >
      <button
        type="button"
        aria-label="순서 드래그"
        className={`${ICON_BTN} cursor-grab touch-none text-muted active:cursor-grabbing`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>

      <button type="button" onClick={() => onOpen(index)} className="flex flex-1 flex-col gap-xs text-left">
        <span className="text-base font-semibold text-foreground">{exercise?.nameKo ?? performance.exerciseId}</span>
        <span className="flex items-center gap-sm">
          <span className="text-sm text-muted">
            {exercise ? MUSCLE_GROUP[exercise.primaryMuscle] : ''} · {resolvedCount(performance)}/
            {performance.sets.length}세트
          </span>
          <Badge tone={status?.tone ?? 'secondary'}>{status?.label ?? '대기'}</Badge>
        </span>
      </button>

      <button
        type="button"
        onClick={() => onSwap(index)}
        aria-label="운동 바꾸기"
        className={`${ICON_BTN} text-muted hover:bg-primary-subtle hover:text-primary`}
      >
        ✎
      </button>

      <button
        type="button"
        onClick={() => onRemove(index)}
        aria-label="운동 빼기"
        className={`${ICON_BTN} text-muted hover:bg-error-subtle hover:text-error`}
      >
        ✕
      </button>
    </li>
  );
}

export function SessionExerciseList({ performances, onOpen, onRemove, onSwap, onReorder }: SessionExerciseListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const ids = performances.map((_, index) => String(index));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    onReorder(Number(active.id), Number(over.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-sm">
          {performances.map((performance, index) => (
            <SortableRow
              key={String(index)}
              id={String(index)}
              index={index}
              performance={performance}
              onOpen={onOpen}
              onRemove={onRemove}
              onSwap={onSwap}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
