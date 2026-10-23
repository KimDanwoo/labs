import { TIME, type TimeOfDay } from '@features/walk/model/constants';
import type { Region } from '@shared/world/world';

export type AmbienceMix = { water: number; waves: number; cicadas: number; birds: number; crickets: number };
type Layers = Pick<AmbienceMix, 'water' | 'waves' | 'cicadas'>;

const REGION_LAYERS = {
  village: { water: 0, waves: 0, cicadas: 0.25 },
  river: { water: 1, waves: 0, cicadas: 0.15 },
  coast: { water: 0, waves: 1, cicadas: 0 },
  forest: { water: 0, waves: 0, cicadas: 1 },
  school: { water: 0, waves: 0, cicadas: 0.45 },
  shops: { water: 0, waves: 0, cicadas: 0.2 },
} satisfies Record<Region, Layers>;

const EVENING_CICADA_SHARE = 0.3;

/** Each place keeps its own sound; at dusk birds give way to crickets, and at night the cicadas fall silent. */
export function ambienceMix(region: Region, time: TimeOfDay): AmbienceMix {
  const layers = REGION_LAYERS[region];
  if (time === TIME.day) return { ...layers, birds: 1, crickets: 0 };
  const cicadas = time === TIME.evening ? layers.cicadas * EVENING_CICADA_SHARE : 0;
  return { ...layers, cicadas, birds: 0, crickets: 1 };
}
