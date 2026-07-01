import React from 'react';

import { cn } from '@shared/lib/cn';

type DataSectionProps = {
  children: React.ReactNode;
  className?: string;
};

export function DataSection({ children, className }: DataSectionProps) {
  return (
    <div className={cn('bg-[#faf9f7] px-5 py-6', className)}>{children}</div>
  );
}
