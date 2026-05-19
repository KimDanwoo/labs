import { BRANCH_KR, STEM_KR } from '@views/destiny-result/constants';

import type { Pillar } from '@entities/destiny/model';

export function pillarToKr(pillar: Pillar): string {
  return `${STEM_KR[pillar.stem]}${BRANCH_KR[pillar.branch]}`;
}
