import * as THREE from 'three/webgpu';

import { type Keyframe } from '@views/drive/lib/engine/game/cycles/cycleKeyframes';
import { Cycles } from '@views/drive/lib/engine/game/cycles/cycles';
import { WORLD_CONFIG } from '@views/drive/lib/engine/worldConfig';

interface DayPreset {
  electricField: number;
  temperature: number;
  lightColor: THREE.Color;
  lightIntensity: number;
  shadowColor: THREE.Color;
  fogColorA: THREE.Color;
  fogColorB: THREE.Color;
  fogNearRatio: number;
  fogFarRatio: number;
}

type DayInterval = 'night' | 'deepNight';

const DAY_SECONDS = 8 * 60;
const MORNING_PROGRESS = 0.02;

interface PresetColors {
  light: string;
  shadow: string;
  fogA: string;
  fogB: string;
}

interface PresetNumbers {
  electricField: number;
  temperature: number;
  lightIntensity: number;
  fogNearRatio: number;
  fogFarRatio: number;
}

const preset = (colors: PresetColors, numbers: PresetNumbers): DayPreset => ({
  ...numbers,
  lightColor: new THREE.Color(colors.light),
  shadowColor: new THREE.Color(colors.shadow),
  fogColorA: new THREE.Color(colors.fogA),
  fogColorB: new THREE.Color(colors.fogB),
});

const PRESETS = {
  day: preset(
    { light: '#fff5e6', shadow: '#8aaee8', fogA: '#82d5e5', fogB: '#c9eaf4' },
    {
      electricField: 0,
      temperature: 5,
      lightIntensity: 1.2,
      fogNearRatio: 0.315,
      fogFarRatio: 1.25,
    },
  ),
  dusk: preset(
    { light: '#ffb49c', shadow: '#7a88b8', fogA: '#f5a593', fogB: '#f3bdb4' },
    {
      electricField: 0.25,
      temperature: 0,
      lightIntensity: 1.2,
      fogNearRatio: 0,
      fogFarRatio: 1.25,
    },
  ),
  night: preset(
    { light: '#4c6ca6', shadow: '#3d528e', fogA: '#0e2546', fogB: '#1c3a66' },
    {
      electricField: 1,
      temperature: -7.5,
      lightIntensity: 3.8,
      fogNearRatio: -0.85,
      fogFarRatio: 1,
    },
  ),
  dawn: preset(
    { light: '#ffe0bb', shadow: '#95accb', fogA: '#f5d1b2', fogB: '#d2e4ed' },
    {
      electricField: 0.25,
      temperature: 0,
      lightIntensity: 1.2,
      fogNearRatio: 0.3,
      fogFarRatio: 1.25,
    },
  ),
} satisfies Record<string, DayPreset>;

const KEYFRAMES: Keyframe<DayPreset>[] = [
  { properties: PRESETS.day, stop: 0 },
  { properties: PRESETS.day, stop: 0.48 },
  { properties: PRESETS.dusk, stop: 0.56 },
  { properties: PRESETS.night, stop: 0.64 },
  { properties: PRESETS.night, stop: 0.82 },
  { properties: PRESETS.dawn, stop: 0.92 },
];

export class DayCycles extends Cycles<DayPreset, DayInterval> {
  constructor() {
    super({
      durationSeconds: DAY_SECONDS,
      forcedProgress: WORLD_CONFIG.dayCycleProgress,
      startProgress: MORNING_PROGRESS,
      keyframes: KEYFRAMES,
      intervals: [
        { name: 'night', start: 0.56, end: 0.88 },
        { name: 'deepNight', start: 0.64, end: 0.82 },
      ],
    });
  }
}
