import { worldAsset } from '@views/drive/config/worldAsset';
import type { IslandPlace } from '@views/drive/lib/engine/game/islandPlaces';
import { createElement } from '@views/drive/lib/engine/game/utilities/createElement';

export const FUNNEL = { height: 9, bottomRadius: 0.7, topRadius: 3.4, segments: 48, rows: 24, sway: 0.35 } as const;
export const DEBRIS = { count: 140, size: 0.18 } as const;
export const DUST = { radius: 3 } as const;
export const SPIN = { idle: 1, surge: 3.2, surgeIn: 0.4, surgeOut: 2.2 } as const;
export const TRIGGER = { radius: 2, maxHeight: 2.5, cooldown: 2 } as const;
export const LIFT = { upward: 11, spin: 9, carry: 0, duration: 1.6, updraft: 14 } as const;
export const VISIT = { radius: 10, interval: 0.5 } as const;
export const COLORS = { sand: '#e9d7ae', dust: '#c9b28a', mist: '#f7f3ea', leaf: '#7cbf5a' } as const;
export const ORIGIN = 'altar';
export const NOTICE_DURATION = 3;
export function debrisData(): { seeds: Float32Array; heights: Float32Array } {
  const seeds = new Float32Array(DEBRIS.count);
  const heights = new Float32Array(DEBRIS.count);
  for (let index = 0; index < DEBRIS.count; index += 1) {
    seeds[index] = Math.random();
    heights[index] = Math.random();
  }
  return { seeds, heights };
}
export function arrivalNotice({ name, icon }: IslandPlace): HTMLElement {
  const image = createElement('img', 'arrival-icon');
  image.src = worldAsset(`ui/map/icons/${icon}.webp`);
  image.alt = '';
  return createElement('div', 'top', [
    image,
    createElement('div', 'arrival-text', [
      createElement('span', 'arrival-label', ['회오리 이동']),
      createElement('strong', 'arrival-name', [name]),
    ]),
  ]);
}
