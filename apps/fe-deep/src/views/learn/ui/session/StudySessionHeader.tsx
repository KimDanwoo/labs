import type { ReactNode } from 'react';

import { Badge } from '@shared/ui/Badge';
import { Progress } from '@shared/ui/Progress';

import { useStudySessionContext } from '@views/learn/model/hooks/useStudySessionContext';

interface StudySessionHeaderProps {
  children?: ReactNode;
}

export function StudySessionHeader({ children }: StudySessionHeaderProps) {
  const { currentIndex, totalCount, isNewCard, isFlipped, progressPercent } = useStudySessionContext();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-normal tabular-nums text-muted-foreground">
            {currentIndex + 1} / {totalCount}
          </span>
          {isNewCard && (
            <Badge variant="secondary" className="text-xs">
              NEW
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isFlipped && <span className="text-xs text-muted-foreground/70">Space 또는 ⌘/Ctrl+Enter</span>}
          {isFlipped && <span className="text-xs text-muted-foreground/70">Space/Enter로 다음</span>}
          {children}
        </div>
      </div>
      <Progress value={progressPercent} className="h-1.5" />
    </div>
  );
}
