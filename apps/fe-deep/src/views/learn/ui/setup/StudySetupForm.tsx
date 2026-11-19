import { Card } from '@shared/ui/Card';
import type { ReactNode } from 'react';

interface StudySetupFormProps {
  children: ReactNode;
}

export function StudySetupForm({ children }: StudySetupFormProps) {
  return <Card className="p-6 space-y-6">{children}</Card>;
}
