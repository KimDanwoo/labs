'use client';

import { useWalk } from '@views/walk/model/hooks/useWalk';
import { WalkContext } from '@views/walk/model/store/walkContext';
import type { ReactNode } from 'react';

interface WalkRootProps {
  children: ReactNode;
}

export function WalkRoot({ children }: WalkRootProps) {
  const walk = useWalk();
  const { activities, timeOfDay, isRaining, hasStarted } = walk;
  return (
    <WalkContext.Provider value={walk}>
      <main
        className={`walk ${activities.isActive ? 'is-fishing' : ''} is-${timeOfDay} ${isRaining ? 'is-raining' : ''} ${hasStarted ? 'has-started' : ''}`}
      >
        {children}
      </main>
    </WalkContext.Provider>
  );
}
