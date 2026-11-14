import { Events } from './events';

export const QUALITY = { high: 0, low: 1 } as const;
export type QualityLevel = (typeof QUALITY)[keyof typeof QUALITY];

const MOBILE_AGENT = /Mobi|Android|iPhone|iPad|iPod/i;

export class Quality {
  readonly events = new Events<{ change: [QualityLevel] }>();
  level: QualityLevel = MOBILE_AGENT.test(navigator.userAgent) ? QUALITY.low : QUALITY.high;

  changeLevel(level: QualityLevel = QUALITY.high): void {
    if (level === this.level) return;
    this.level = level;
    this.events.trigger('change', level);
  }
}
