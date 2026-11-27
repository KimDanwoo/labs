import type { ReactNode } from 'react';

import { IconCircle } from '@shared/ui/icon-circle';

interface RuleCardIconProps {
  children: ReactNode;
}

export function RuleCardIcon({ children }: RuleCardIconProps) {
  return (
    <IconCircle size="s" tone="plain" className="row-span-2">
      {children}
    </IconCircle>
  );
}
