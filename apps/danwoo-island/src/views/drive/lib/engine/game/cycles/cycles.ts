import * as THREE from 'three/webgpu';

import { Events } from '../events';
import { getGame } from '../gameContext';
import { TICK_ORDER } from '../tickOrder';
import { lerp, smoothstep } from '../utilities/maths';
import {
  CycleOverride,
  type CycleProperty,
  type CycleValue,
  type CycleValues,
  type CyclesOptions,
  type EmitEvent,
  FIRST_FRAME_DELAY,
  type Interval,
  type Keyframe,
  type KeysMatching,
  MILLISECONDS_PER_SECOND,
  type ResolvedKeyframe,
  blend,
  cloneValue,
  valuesOf,
  wrapKeyframes,
} from './cycleKeyframes';

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
    this.game.ticker.events.on('tick', () => this.update(), TICK_ORDER.cycles);
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
