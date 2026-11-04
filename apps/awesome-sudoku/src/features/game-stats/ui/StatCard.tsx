'use client';
import { cn } from '@shared/model/utils';
import { memo } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'amber' | 'rose';
}

const colorStyles = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
};
export const StatCard = memo<StatCardProps>(({ label, value, icon, color }) => (
  <div
    className={cn(
      'bg-[rgb(var(--color-surface-primary))] rounded-2xl p-4',
      'shadow-sm border border-[rgb(var(--color-border-light))]',
    )}
  >
    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', colorStyles[color])}>{icon}</div>
    <p className="text-2xl font-bold text-[rgb(var(--color-text-primary))] font-tabular">{value}</p>
    <p className="text-sm text-[rgb(var(--color-text-secondary))] mt-0.5">{label}</p>
  </div>
));

StatCard.displayName = 'StatCard';
