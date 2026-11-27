import type { ReactNode } from 'react';

import { Trial } from '@views/game-library/ui/trial/trial';

interface HomeTrialProps {
  wallsGuide: ReactNode;
}

export function HomeTrial({ wallsGuide }: HomeTrialProps) {
  return (
    <Trial.Root wallsGuide={wallsGuide}>
      <Trial.Heading />
      <Trial.Tabs />
      <Trial.Slides />
      <Trial.Pager />
    </Trial.Root>
  );
}
