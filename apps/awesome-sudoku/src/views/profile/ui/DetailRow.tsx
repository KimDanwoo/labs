'use client';
import { cn } from '@shared/lib/cn';

export const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-[rgb(var(--color-text-secondary))]">{label}</span>
    <span className={cn('font-normal', 'text-[rgb(var(--color-text-primary))]')}>{value}</span>
  </div>
);
