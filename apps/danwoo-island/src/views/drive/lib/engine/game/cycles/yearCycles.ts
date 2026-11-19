import { WORLD_CONFIG } from '../../worldConfig';
import { type Keyframe } from './cycleKeyframes';
import { Cycles } from './cycles';

interface SeasonPreset {
  temperature: number;
  humidity: number;
  clouds: number;
  wind: number;
}

const YEAR_SECONDS = 60 * 60 * 24 * 365;
const SEASON_OFFSET = 0.125;

const SEASONS = {
  winter: { temperature: 22, humidity: 0.8, clouds: 0.65, wind: 0.3 },
  spring: { temperature: 26, humidity: 0.65, clouds: 0.45, wind: 0.2 },
  summer: { temperature: 30, humidity: 0.5, clouds: 0.3, wind: 0.1 },
  fall: { temperature: 26, humidity: 0.65, clouds: 0.65, wind: 0.25 },
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
