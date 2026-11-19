'use client';

import type { ReactNode } from 'react';
import { useWalk } from '../model/hooks/useWalk';
import { WalkContext } from '../model/store/walkContext';

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
