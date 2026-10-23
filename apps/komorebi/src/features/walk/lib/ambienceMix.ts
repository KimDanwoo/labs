import { TIME, WEATHER, type TimeOfDay, type Weather } from '@features/walk/model/constants';
import type { Region } from '@shared/world/world';

export type AmbienceMix = {
  water: number;
  waves: number;
  cicadas: number;
  birds: number;
  crickets: number;
  rain: number;
};
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
const RAIN_INSECT_SHARE = 0.3;

/** Each place keeps its own sound; at dusk birds give way to crickets, and at night the cicadas fall silent. */
export function ambienceMix(region: Region, time: TimeOfDay, weather: Weather = WEATHER.clear): AmbienceMix {
  const clear = timeMix(region, time);
  if (weather === WEATHER.clear) return clear;
  // A shower hushes the birds and insects under the patter.
  return {
    ...clear,
    birds: 0,
    cicadas: clear.cicadas * RAIN_INSECT_SHARE,
    crickets: clear.crickets * RAIN_INSECT_SHARE,
    rain: 1,
  };
}

function timeMix(region: Region, time: TimeOfDay): AmbienceMix {
  const layers = REGION_LAYERS[region];
  if (time === TIME.day) return { ...layers, birds: 1, crickets: 0, rain: 0 };
  const cicadas = time === TIME.evening ? layers.cicadas * EVENING_CICADA_SHARE : 0;
  return { ...layers, cicadas, birds: 0, crickets: 1, rain: 0 };
}
