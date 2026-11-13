'use client';

import type { QuestionVisibilityField } from '@entities/question';
import { Button } from '@ui/react';
import { Trash2 } from 'lucide-react';
import { Fragment } from 'react';
import { VISIBILITY_FIELD, VISIBILITY_LABEL } from '../config/questionList';
import { VisibilityToggle } from './VisibilityToggle';

const FIELDS = Object.values(VISIBILITY_FIELD);

type BulkActionBarProps = {
  selectedCount: number;
  visibleCounts: Record<QuestionVisibilityField, number>;
  onDelete: () => void;
  onVisibilityChange: (field: QuestionVisibilityField, isVisible: boolean) => void;
};

export function BulkActionBar({ selectedCount, visibleCounts, onDelete, onVisibilityChange }: BulkActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
      <span className="text-sm font-normal mr-2">일괄 작업:</span>
      <Button variant="destructive" size="sm" onClick={onDelete} className="gap-1">
        <Trash2 className="size-3.5" />
        삭제 ({selectedCount})
      </Button>
      {FIELDS.map((field) => (
        <Fragment key={field}>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground">
            {VISIBILITY_LABEL[field]} {visibleCounts[field]}/{selectedCount} ON
          </span>
          <VisibilityToggle field={field} onChange={onVisibilityChange} />
        </Fragment>
      ))}
    </div>
  );
}
