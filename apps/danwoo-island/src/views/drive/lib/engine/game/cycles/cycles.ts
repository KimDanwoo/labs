import gsap from 'gsap';
import * as THREE from 'three/webgpu';

import { Events } from '../events';
import { getGame } from '../gameContext';
import { lerp, smoothstep } from '../utilities/maths';

export type CycleValue = number | THREE.Color;
export type CycleValues = Record<string, CycleValue>;
type KeysMatching<P, V> = { [K in keyof P]: P[K] extends V ? K : never }[keyof P];

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

export type CycleOverrideValues<P extends Record<keyof P, CycleValue>> = Partial<P> & { progress?: number };

interface CyclesOptions<P extends Record<keyof P, CycleValue>, N extends string> {
  durationSeconds: number;
  forcedProgress: number | null;
  keyframes: readonly Keyframe<P>[];
  intervals?: readonly Interval<N>[];
}

type EmitEvent = (emit: () => void) => void;

interface ResolvedKeyframe {
  stop: number;
  values: Map<string, CycleValue>;
}

const MILLISECONDS_PER_SECOND = 1000;
const OVERRIDE_SECONDS = 5;
const TICK_ORDER = 8;
const FIRST_FRAME_DELAY = 1;

const valuesOf = (values: object): Map<string, CycleValue> =>
  new Map(Object.entries(values).filter((entry): entry is [string, CycleValue] => isCycleValue(entry[1])));

function isCycleValue(value: unknown): value is CycleValue {
  return typeof value === 'number' || value instanceof THREE.Color;
}

const cloneValue = (value: CycleValue): CycleValue => (value instanceof THREE.Color ? value.clone() : value);

function blend(target: CycleValue, from: CycleValue, to: CycleValue, ratio: number): CycleValue {
  if (target instanceof THREE.Color && from instanceof THREE.Color && to instanceof THREE.Color) {
    return target.lerpColors(from, to, ratio);
  }
  if (typeof from === 'number' && typeof to === 'number') return lerp(from, to, ratio);
  return target;
}

function wrapKeyframes<P extends Record<keyof P, CycleValue>>(keyframes: readonly Keyframe<P>[]): Keyframe<P>[] {
  const first = keyframes[0];
  const last = keyframes.at(-1);
  if (!first || !last) throw new Error('Cycles need at least one keyframe');
  const wrapped = [...keyframes];
  if (last.stop < 1) wrapped.push({ ...first, stop: 1 + first.stop });
  if (first.stop > 0) wrapped.unshift({ ...last, stop: -(1 - last.stop) });
  return wrapped;
}

class CycleOverride<P extends Record<keyof P, CycleValue>> {
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

export abstract class Cycles<P extends Record<keyof P, CycleValue>, N extends string = never> {
  readonly game = getGame();
  readonly events = new Events<Record<N, [isInside: boolean]>>();
  readonly properties: Record<string, CycleProperty>;
  readonly override: CycleOverride<P>;
  absoluteProgress: number;
  progress: number;
  progressDelta = 1;
  readonly #durationSeconds: number;
  readonly #forcedProgress: number | null;
  readonly #keyframes: ResolvedKeyframe[];
  readonly #insideIntervals = new Map<N, boolean>();
  readonly #intervals: readonly Interval<N>[];

  protected constructor({ durationSeconds, forcedProgress, keyframes, intervals = [] }: CyclesOptions<P, N>) {
    this.#durationSeconds = durationSeconds;
    this.#forcedProgress = forcedProgress;
    this.#keyframes = wrapKeyframes(keyframes).map(({ stop, properties }) => ({ stop, values: valuesOf(properties) }));
    this.#intervals = intervals;
    this.absoluteProgress = this.#currentAbsoluteProgress();
    this.progress = this.absoluteProgress % 1;
    this.properties = this.#initialProperties(keyframes);
    this.override = new CycleOverride(this.properties);
    this.game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
    this.#advance((emit) => this.game.ticker.wait(FIRST_FRAME_DELAY, emit));
  }

  isInInterval(name: N): boolean {
    return this.#insideIntervals.get(name) ?? false;
  }

  colorOf(key: KeysMatching<P, THREE.Color>): THREE.Color {
    const { value } = this.#property(key);
    if (!(value instanceof THREE.Color)) throw new Error(`${String(key)} is not a color`);
    return value;
  }

  numberOf(key: KeysMatching<P, number>): number {
    const { value } = this.#property(key);
    if (typeof value !== 'number') throw new Error(`${String(key)} is not a number`);
    return value;
  }

  update(): void {
    this.#advance((emit) => emit());
  }

  #currentAbsoluteProgress(): number {
    return this.#forcedProgress ?? Date.now() / MILLISECONDS_PER_SECOND / this.#durationSeconds;
  }

  #initialProperties(keyframes: readonly Keyframe<P>[]): Record<string, CycleProperty> {
    const first: CycleValues = keyframes[0]?.properties ?? {};
    return Object.fromEntries(
      Object.entries(first).map(([key, value]) => [key, { value: cloneValue(value), overrideValue: null }]),
    );
  }

  #property(key: PropertyKey): CycleProperty {
    const property = this.properties[String(key)];
    if (!property) throw new Error(`Unknown cycle property ${String(key)}`);
    return property;
  }

  #advance(emitEvent: EmitEvent): void {
    const absoluteProgress = this.#currentAbsoluteProgress();
    this.progressDelta = absoluteProgress - this.absoluteProgress;
    this.absoluteProgress = absoluteProgress;
    const progress = absoluteProgress % 1;
    this.#updateIntervals(progress, emitEvent);
    this.progress = this.#overriddenProgress(progress);
    this.#interpolateProperties();
  }

  #updateIntervals(progress: number, emitEvent: EmitEvent): void {
    for (const { name, start, end } of this.#intervals) {
      const isInside = progress > start && progress < end;
      if (isInside === this.isInInterval(name)) continue;
      this.#insideIntervals.set(name, isInside);
      emitEvent(() => this.events.trigger(name, isInside));
    }
  }

  #overriddenProgress(progress: number): number {
    const { strength, progress: target } = this.override;
    return strength > 0 && target !== null ? lerp(progress, target, strength) : progress;
  }

  #interpolateProperties(): void {
    const previousIndex = this.#keyframes.reduce(
      (found, keyframe, index) => (keyframe.stop <= this.progress ? index : found),
      -1,
    );
    const previous = this.#keyframes[previousIndex];
    const next = this.#keyframes[(previousIndex + 1) % this.#keyframes.length];
    if (!previous || !next) return;
    const ratio = smoothstep(this.progress, previous.stop, next.stop);
    const { strength } = this.override;

    for (const [key, property] of Object.entries(this.properties)) {
      const from = previous.values.get(key);
      const to = next.values.get(key);
      if (from === undefined || to === undefined) continue;
      property.value = blend(property.value, from, to, ratio);
      if (strength > 0 && property.overrideValue !== null) {
        property.value = blend(property.value, property.value, property.overrideValue, strength);
      }
    }
  }
}
