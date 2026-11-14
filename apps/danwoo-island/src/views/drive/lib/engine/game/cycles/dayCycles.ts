import * as THREE from 'three/webgpu';

import { WORLD_CONFIG } from '../../worldConfig';
import { Cycles, type Keyframe } from './cycles';

interface DayPreset {
  revealColor: THREE.Color;
  revealIntensity: number;
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

const DAY_SECONDS = 4 * 60;

interface PresetColors {
  reveal: string;
  light: string;
  shadow: string;
  fogA: string;
  fogB: string;
}

interface PresetNumbers {
  revealIntensity: number;
  electricField: number;
  temperature: number;
  lightIntensity: number;
  fogNearRatio: number;
  fogFarRatio: number;
}

const preset = (colors: PresetColors, numbers: PresetNumbers): DayPreset => ({
  ...numbers,
  revealColor: new THREE.Color(colors.reveal),
  lightColor: new THREE.Color(colors.light),
  shadowColor: new THREE.Color(colors.shadow),
  fogColorA: new THREE.Color(colors.fogA),
  fogColorB: new THREE.Color(colors.fogB),
});

const PRESETS = {
  day: preset(
    { reveal: '#79cbd5', light: '#fff5e6', shadow: '#8aaee8', fogA: '#82d5e5', fogB: '#c9eaf4' },
    {
      revealIntensity: 12,
      electricField: 0,
      temperature: 5,
      lightIntensity: 1.2,
      fogNearRatio: 0.315,
      fogFarRatio: 1.25,
    },
  ),
  dusk: preset(
    { reveal: '#e8a18a', light: '#ffb88f', shadow: '#7187b2', fogA: '#f4b493', fogB: '#e9b7c6' },
    {
      revealIntensity: 5.55,
      electricField: 0.25,
      temperature: 0,
      lightIntensity: 1.2,
      fogNearRatio: 0,
      fogFarRatio: 1.25,
    },
  ),
  night: preset(
    { reveal: '#5e8da8', light: '#3f5d80', shadow: '#425d85', fogA: '#122c40', fogB: '#203b50' },
    {
      revealIntensity: 10,
      electricField: 1,
      temperature: -7.5,
      lightIntensity: 3.8,
      fogNearRatio: -0.85,
      fogFarRatio: 1,
    },
  ),
  dawn: preset(
    { reveal: '#e8b99e', light: '#ffe0bb', shadow: '#95accb', fogA: '#f5d1b2', fogB: '#d2e4ed' },
    {
      revealIntensity: 4.85,
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
  { properties: PRESETS.day, stop: 0.15 },
  { properties: PRESETS.dusk, stop: 0.25 },
  { properties: PRESETS.night, stop: 0.35 },
  { properties: PRESETS.night, stop: 0.6 },
  { properties: PRESETS.dawn, stop: 0.8 },
  { properties: PRESETS.day, stop: 0.9 },
];

export class DayCycles extends Cycles<DayPreset, DayInterval> {
  constructor() {
    super({
      durationSeconds: DAY_SECONDS,
      forcedProgress: WORLD_CONFIG.dayCycleProgress,
      keyframes: KEYFRAMES,
      intervals: [
        { name: 'night', start: 0.25, end: 0.7 },
        { name: 'deepNight', start: 0.35, end: 0.6 },
      ],
    });
  }
}
