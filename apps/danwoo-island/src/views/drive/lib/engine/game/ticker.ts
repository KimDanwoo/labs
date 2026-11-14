import { uniform } from 'three/tsl';

import { Events } from './events';

interface FrameWait {
  remaining: number;
  callback: () => void;
}

const MILLISECONDS_PER_SECOND = 1000;
const INITIAL_DELTA = 1 / 60;
const MAX_DELTA = 1 / 30;
const INITIAL_SCALE = 2;
const AVERAGE_WINDOW = 30;

export class Ticker {
  readonly events = new Events<{ tick: [] }>();
  readonly maxDelta = MAX_DELTA;
  elapsed = 0;
  delta = INITIAL_DELTA;
  scale = INITIAL_SCALE;
  deltaScaled = INITIAL_DELTA * INITIAL_SCALE;
  elapsedScaled = 0;
  deltaAverage = INITIAL_DELTA;
  readonly elapsedUniform = uniform(0);
  readonly deltaUniform = uniform(INITIAL_DELTA);
  readonly elapsedScaledUniform = uniform(0);
  readonly deltaScaledUniform = uniform(INITIAL_DELTA * INITIAL_SCALE);
  readonly #waits: FrameWait[] = [];
  readonly #recentDeltas: number[] = [];

  update(timestamp: number): void {
    const elapsed = timestamp / MILLISECONDS_PER_SECOND;
    this.delta = Math.min(elapsed - this.elapsed, this.maxDelta);
    this.elapsed = elapsed;
    this.deltaScaled = this.delta * this.scale;
    this.elapsedScaled += this.deltaScaled;
    this.deltaAverage = this.#averageDelta();
    this.#syncUniforms();
    this.#runDueWaits();
    this.events.trigger('tick');
  }

  wait(frames: number, callback: () => void): void {
    this.#waits.push({ remaining: frames, callback });
  }

  #averageDelta(): number {
    this.#recentDeltas.unshift(this.delta);
    const countBeforeTrim = this.#recentDeltas.length;
    this.#recentDeltas.length = Math.min(countBeforeTrim, AVERAGE_WINDOW);
    return this.#recentDeltas.reduce((total, value) => total + value, 0) / countBeforeTrim;
  }

  #syncUniforms(): void {
    this.elapsedUniform.value = this.elapsed;
    this.deltaUniform.value = this.delta;
    this.elapsedScaledUniform.value = this.elapsedScaled;
    this.deltaScaledUniform.value = this.deltaScaled;
  }

  #runDueWaits(): void {
    for (let index = 0; index < this.#waits.length; index += 1) {
      const wait = this.#waits[index];
      if (!wait) continue;
      wait.remaining -= 1;
      if (wait.remaining !== 0) continue;
      wait.callback();
      this.#waits.splice(index, 1);
      index -= 1;
    }
  }
}
