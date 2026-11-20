import type { IslandPlace } from '@views/drive/lib/engine/game/islandPlaces';
import type { ScreenInsets } from '@views/drive/lib/engine/game/view/overviewFrame';
import * as THREE from 'three/webgpu';

export const MAP_ACTION = {
  name: 'map',
  categories: ['modal', 'menu', 'wandering'],
  keys: ['Keyboard.m', 'Keyboard.KeyM'],
};
export const PIN_LIFT = 1.6;
export const FLIGHT = { rise: 1.3, land: 1.5, ease: 'power3.inOut' } as const;
export const HIDDEN_CLASS = 'is-hidden';
export const SELECTED_CLASS = 'is-selected';
export const LABEL_LEFT_CLASS = 'is-label-left';
export const LABEL_FLIP_MARGIN = 150;
export const COMPACT_SCREEN = { width: 720, height: 500 } as const;
export const REFRAME_DURATION = 0.3;
export const PAN_REACH = 0.6;
export const FRAME_INSETS = {
  wide: { top: 130, right: 290, bottom: 75, left: 60 },
  compact: { top: 120, right: 40, bottom: 80, left: 40 },
  short: { top: 120, right: 340, bottom: 80, left: 40 },
} as const satisfies Record<string, ScreenInsets>;
export interface Pin {
  readonly place: IslandPlace;
  readonly element: HTMLElement;
  readonly anchor: THREE.Vector3;
}
