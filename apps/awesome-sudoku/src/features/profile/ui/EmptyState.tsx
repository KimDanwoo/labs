'use client';
import { cn } from '@shared/model/utils';

export const EmptyState = () => (
  <div className={cn('text-center py-12', 'text-[rgb(var(--color-text-secondary))]')}>
    <p>아직 완료한 게임이 없습니다.</p>
    <p className="text-sm mt-1">게임을 완료하면 여기에 표시됩니다.</p>
  </div>
);
