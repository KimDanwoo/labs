import { WORLD_CONFIG } from '../../worldConfig';
import { Cycles, type Keyframe } from './cycles';

interface SeasonPreset {
  leaves: number;
  temperature: number;
  humidity: number;
  clouds: number;
  wind: number;
}

const YEAR_SECONDS = 60 * 60 * 24 * 365;
const SEASON_OFFSET = 0.125;

const SEASONS = {
  winter: { leaves: 0.25, temperature: 5, humidity: 0.8, clouds: 0.65, wind: 0.3 },
  spring: { leaves: 0, temperature: 15, humidity: 0.65, clouds: 0.45, wind: 0.2 },
  summer: { leaves: 0.25, temperature: 25, humidity: 0.5, clouds: 0.3, wind: 0.1 },
  fall: { leaves: 1, temperature: 15, humidity: 0.65, clouds: 0.65, wind: 0.25 },
} satisfies Record<string, SeasonPreset>;

const KEYFRAMES: Keyframe<SeasonPreset>[] = [
  { properties: SEASONS.winter, stop: SEASON_OFFSET },
  { properties: SEASONS.spring, stop: 0.25 + SEASON_OFFSET },
  { properties: SEASONS.summer, stop: 0.5 + SEASON_OFFSET },
  { properties: SEASONS.fall, stop: 0.75 + SEASON_OFFSET },
];

export class YearCycles extends Cycles<SeasonPreset> {
  constructor() {
    super({ durationSeconds: YEAR_SECONDS, forcedProgress: WORLD_CONFIG.yearCycleProgress, keyframes: KEYFRAMES });
  }
}
