import { lerp } from '@views/drive/lib/engine/game/utilities/maths';
import gsap from 'gsap';
import * as THREE from 'three/webgpu';

export type CycleValue = number | THREE.Color;

export type CycleValues = Record<string, CycleValue>;

export type KeysMatching<P, V> = { [K in keyof P]: P[K] extends V ? K : never }[keyof P];

export interface Keyframe<P extends Record<keyof P, CycleValue>> {
  properties: P;
  stop: number;
}

export interface Interval<N extends string> {
  name: N;
  start: number;
  end: number;
}

export interface CycleProperty {
  value: CycleValue;
  overrideValue: CycleValue | null;
}

type CycleOverrideValues<P extends Record<keyof P, CycleValue>> = Partial<P> & { progress?: number };

export interface CyclesOptions<P extends Record<keyof P, CycleValue>, N extends string> {
  durationSeconds: number;
  forcedProgress: number | null;
  startProgress?: number;
  keyframes: readonly Keyframe<P>[];
  intervals?: readonly Interval<N>[];
}

export type EmitEvent = (emit: () => void) => void;

export interface ResolvedKeyframe {
  stop: number;
  values: Map<string, CycleValue>;
}

export const MILLISECONDS_PER_SECOND = 1000;

const OVERRIDE_SECONDS = 5;

export const FIRST_FRAME_DELAY = 1;

export const valuesOf = (values: object): Map<string, CycleValue> =>
  new Map(Object.entries(values).filter((entry): entry is [string, CycleValue] => isCycleValue(entry[1])));

function isCycleValue(value: unknown): value is CycleValue {
  return typeof value === 'number' || value instanceof THREE.Color;
}

export const cloneValue = (value: CycleValue): CycleValue => (value instanceof THREE.Color ? value.clone() : value);

export function blend(target: CycleValue, from: CycleValue, to: CycleValue, ratio: number): CycleValue {
  const isColorTriple = target instanceof THREE.Color && from instanceof THREE.Color && to instanceof THREE.Color;
  if (isColorTriple) {
    return target.lerpColors(from, to, ratio);
  }
  const isNumberPair = typeof from === 'number' && typeof to === 'number';
  if (isNumberPair) return lerp(from, to, ratio);
  return target;
}

export function wrapKeyframes<P extends Record<keyof P, CycleValue>>(keyframes: readonly Keyframe<P>[]): Keyframe<P>[] {
  const first = keyframes[0];
  const last = keyframes.at(-1);
  if (!first) throw new Error('Cycles need at least one keyframe');
  if (!last) throw new Error('Cycles need at least one keyframe');
  const wrapped = [...keyframes];
  if (last.stop < 1) wrapped.push({ ...first, stop: 1 + first.stop });
  if (first.stop > 0) wrapped.unshift({ ...last, stop: -(1 - last.stop) });
  return wrapped;
}

export class CycleOverride<P extends Record<keyof P, CycleValue>> {
  strength = 0;
  progress: number | null = null;
  readonly #properties: Record<string, CycleProperty>;

  constructor(properties: Record<string, CycleProperty>) {
    this.#properties = properties;
  }

  start = (values: CycleOverrideValues<P> = {}, seconds = OVERRIDE_SECONDS): void => {
    const overrides = valuesOf(values);
    for (const [key, property] of Object.entries(this.#properties)) property.overrideValue = overrides.get(key) ?? null;
    if (values.progress !== undefined) this.progress = values.progress;
    this.#fadeTo(1, seconds);
  };

  end = (seconds = OVERRIDE_SECONDS): void => {
    this.#fadeTo(0, seconds);
  };

  #fadeTo(strength: number, seconds: number): void {
    if (seconds === 0) {
      this.strength = strength;
      return;
    }
    gsap.to(this, { strength, duration: seconds, overwrite: true });
  }
}
