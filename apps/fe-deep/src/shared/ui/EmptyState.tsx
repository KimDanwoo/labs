import type { ReactNode } from 'react';

import { Card } from '@shared/ui/Card';

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
  children?: ReactNode;
}

export function EmptyState({ icon, message, children }: EmptyStateProps) {
  return (
    <Card className="p-16 text-center shadow-sm">
      {icon && (
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">{icon}</div>
      )}
      <p className="text-muted-foreground">{message}</p>
      {children}
    </Card>
  );
}
