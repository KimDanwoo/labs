'use client';

import type { QuestionVisibilityField } from '@entities/question';
import { Button } from '@ui/react';
import { BookOpenCheck, Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { VISIBILITY_LABEL } from '../config/questionList';

const ON_ICON: Record<QuestionVisibilityField, LucideIcon> = {
  show_in_daily: BookOpenCheck,
  show_in_flashcard: Eye,
};

type VisibilityToggleProps = {
  field: QuestionVisibilityField;
  onChange: (field: QuestionVisibilityField, isVisible: boolean) => void;
};

export function VisibilityToggle({ field, onChange }: VisibilityToggleProps) {
  const OnIcon = ON_ICON[field];
  const label = VISIBILITY_LABEL[field];

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1" onClick={() => onChange(field, true)}>
        <OnIcon className="size-3.5" />
        {label} ON
      </Button>
      <Button variant="outline" size="sm" className="gap-1" onClick={() => onChange(field, false)}>
        <EyeOff className="size-3.5" />
        {label} OFF
      </Button>
    </>
  );
}
