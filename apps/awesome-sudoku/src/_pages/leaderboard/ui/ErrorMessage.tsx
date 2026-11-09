'use client';
import { cn } from '@shared/model/utils';

export const ErrorMessage = ({ message }: { message: string }) => (
  <div className={cn('text-center py-12', 'text-[rgb(var(--color-error))]')}>
    <p>데이터를 불러오는데 실패했습니다.</p>
    <p className="text-sm mt-1">{message}</p>
  </div>
);
