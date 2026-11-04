'use client';
import { cn } from '@shared/model/utils';

export const ErrorState = ({ message }: { message: string }) => (
  <div className={cn('text-center py-12', 'text-[rgb(var(--color-error-text))]')}>
    <p>데이터를 불러오지 못했습니다.</p>
    <p className="text-sm mt-1">{message}</p>
  </div>
);
