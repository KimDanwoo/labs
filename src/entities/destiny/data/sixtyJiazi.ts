import { EARTHLY_BRANCHES } from '@entities/destiny/data/branches';
import type { Pillar } from '@entities/destiny/data/pillar';
import { HEAVENLY_STEMS } from '@entities/destiny/data/stems';

const SIXTY_JIAZI: readonly Pillar[] = Array.from({ length: 60 }, (_, i) => ({
  stem: HEAVENLY_STEMS[i % 10],
  branch: EARTHLY_BRANCHES[i % 12],
})) as readonly Pillar[];

export { SIXTY_JIAZI };
