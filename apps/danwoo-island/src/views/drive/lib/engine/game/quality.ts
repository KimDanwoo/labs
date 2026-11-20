import { Events } from '@views/drive/lib/engine/game/events';

export const QUALITY = { high: 0, low: 1 } as const;
export type QualityLevel = (typeof QUALITY)[keyof typeof QUALITY];

const MOBILE_AGENT = /Mobi|Android|iPhone|iPad|iPod/i;
const DESKTOP_SAFARI_AGENT = /Macintosh/;
const TABLET_TOUCH_POINTS = 1;
const AUTO_LOW = { slowDelta: 1 / 40, holdSeconds: 3, warmupSeconds: 8 } as const;

interface FrameTiming {
  elapsed: number;
  deltaAverage: number;
}

interface DeviceHints {
  userAgent: string;
  maxTouchPoints: number;
}

export function initialLevel({ userAgent, maxTouchPoints }: DeviceHints): QualityLevel {
  const isTabletAsDesktop = DESKTOP_SAFARI_AGENT.test(userAgent) && maxTouchPoints > TABLET_TOUCH_POINTS;
  const isLowEndDevice = MOBILE_AGENT.test(userAgent) || isTabletAsDesktop;
  return isLowEndDevice ? QUALITY.low : QUALITY.high;
}

export class Quality {
  readonly events = new Events<{ change: [QualityLevel] }>();
  level: QualityLevel;
  #isChosen = false;
  #firstSeen: number | null = null;
  #slowSince: number | null = null;

  constructor(hints: DeviceHints = navigator) {
    this.level = initialLevel(hints);
  }

  changeLevel(level: QualityLevel = QUALITY.high): void {
    this.#isChosen = true;
    this.#apply(level);
  }

  observeFrame({ elapsed, deltaAverage }: FrameTiming): void {
    if (this.#isChosen) return;
    if (this.level === QUALITY.low) return;
    this.#firstSeen ??= elapsed;
    if (elapsed - this.#firstSeen < AUTO_LOW.warmupSeconds) return;
    if (deltaAverage <= AUTO_LOW.slowDelta) {
      this.#slowSince = null;
      return;
    }
    this.#slowSince ??= elapsed;
    if (elapsed - this.#slowSince >= AUTO_LOW.holdSeconds) this.#apply(QUALITY.low);
  }

  #apply(level: QualityLevel): void {
    if (level === this.level) return;
    this.level = level;
    this.events.trigger('change', level);
  }
}
