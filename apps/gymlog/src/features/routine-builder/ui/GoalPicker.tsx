'use client';

import { GOAL, type Goal } from '@shared/training';

type Props = {
  goal: Goal;
  onChange: (goal: Goal) => void;
};

const GOAL_OPTIONS = Object.keys(GOAL) as Goal[];

export function GoalPicker({ goal, onChange }: Props) {
  return (
    <div className="flex flex-col gap-sm">
      <span className="text-sm font-medium text-muted">목표</span>
      <div className="grid grid-cols-2 gap-sm">
        {GOAL_OPTIONS.map((option) => {
          const isSelected = goal === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`h-11 rounded-lg border text-sm font-medium transition-colors ${
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-card-border bg-glass text-foreground hover:border-primary'
              }`}
            >
              {GOAL[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
