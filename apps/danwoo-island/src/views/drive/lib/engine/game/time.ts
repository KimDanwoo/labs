import gsap from 'gsap';

import { getGame } from './gameContext';
import { clamp, remap } from './utilities/maths';

const DEFAULT_SCALE = 2;
const BULLET_TIME = { scale: 0.5, inSpeed: 3, outSpeed: 0.3, defaultSeconds: 1.5 } as const;
const MILLISECONDS_PER_SECOND = 1000;
const TICK_ORDER = 0;

class BulletTime {
  isActive = false;
  progress = 0;
  #endTime = 0;

  activate = (seconds: number = BULLET_TIME.defaultSeconds): void => {
    const endTime = Date.now() + seconds * MILLISECONDS_PER_SECOND;
    this.#endTime = this.isActive ? Math.max(this.#endTime, endTime) : endTime;
    this.isActive = true;
  };

  advance(delta: number): number {
    if (Date.now() > this.#endTime) this.isActive = false;
    const speed = this.isActive ? BULLET_TIME.inSpeed : -BULLET_TIME.outSpeed;
    this.progress = clamp(this.progress + delta * speed, 0, 1);
    return this.progress;
  }
}

export class Time {
  readonly game = getGame();
  readonly defaultScale = DEFAULT_SCALE;
  readonly bulletTime = new BulletTime();
  #scale = DEFAULT_SCALE;

  constructor() {
    this.scale = DEFAULT_SCALE;
    this.game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
  }

  get scale(): number {
    return this.#scale;
  }

  set scale(value: number) {
    this.#scale = value;
    this.game.ticker.scale = value;
    gsap.globalTimeline.timeScale(value);
  }

  update(): void {
    const progress = this.bulletTime.advance(this.game.ticker.delta);
    this.scale = remap(progress, [0, 1], [this.defaultScale, BULLET_TIME.scale]);
  }
}
