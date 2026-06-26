'use client';

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Exercise } from '@entities/exercise/model/types';

type Props = {
  selectedExercises: readonly Exercise[];
  onRemove: (exerciseId: string) => void;
  onReorder: (from: number, to: number) => void;
};

const ICON_BTN = 'flex size-7 shrink-0 items-center justify-center rounded-md text-sm transition-colors';

type RowProps = {
  exercise: Exercise;
  index: number;
  onRemove: (exerciseId: string) => void;
};

function SortableRow({ exercise, index, onRemove }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: exercise.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-sm rounded-lg border border-card-border bg-glass p-md ${isDragging ? 'shadow-glow' : ''}`}
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
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {index + 1}
      </span>
      <span className="flex-1 text-base font-medium text-foreground">{exercise.nameKo}</span>
      <button
        type="button"
        onClick={() => onRemove(exercise.id)}
        className={`${ICON_BTN} text-muted hover:bg-error-subtle hover:text-error`}
        aria-label={`${exercise.nameKo} 제거`}
      >
        ✕
      </button>
    </div>
  );
}

export function SelectedExerciseList({ selectedExercises, onRemove, onReorder }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  if (selectedExercises.length === 0) {
    return <p className="py-3xl text-center text-sm text-muted">종목을 선택하면 여기에 표시됩니다</p>;
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const from = selectedExercises.findIndex((exercise) => exercise.id === active.id);
    const to = selectedExercises.findIndex((exercise) => exercise.id === over.id);
    if (from !== -1 && to !== -1) {
      onReorder(from, to);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={selectedExercises.map((exercise) => exercise.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-xs">
          {selectedExercises.map((exercise, index) => (
            <SortableRow key={exercise.id} exercise={exercise} index={index} onRemove={onRemove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
