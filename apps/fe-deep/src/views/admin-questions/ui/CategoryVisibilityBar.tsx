'use client';

import type { QuestionVisibilityField } from '@entities/question';
import { FolderSync } from 'lucide-react';
import { VISIBILITY_FIELD } from '../config/questionList';
import { VisibilityToggle } from './VisibilityToggle';

type CategoryVisibilityBarProps = {
  onChange: (field: QuestionVisibilityField, isVisible: boolean) => void;
};

export function CategoryVisibilityBar({ onChange }: CategoryVisibilityBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-3">
      <FolderSync className="size-4 text-muted-foreground" />
      <span className="text-sm font-normal mr-1">카테고리 전체:</span>
      <VisibilityToggle field={VISIBILITY_FIELD.daily} onChange={onChange} />
      <div className="h-4 w-px bg-border" />
      <VisibilityToggle field={VISIBILITY_FIELD.flashcard} onChange={onChange} />
    </div>
  );
}
