import * as THREE from 'three/webgpu';
import { type SoundHandler, isVectorLike } from './audioItem';
import { getGame } from './gameContext';
import { createElement } from './utilities/createElement';
import { remapClamp } from './utilities/maths';

export const IS_IOS =
  /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const RATE_RANGE = { min: 0.5, max: 4 } as const;
export const CAMERA_DEPTH_SCALE = 0.1;
export const MAX_PARALLEL_LOADS = 4;
const IDLE_TIMEOUT_MS = 2000;
export function scheduleIdle(task: () => void): void {
  if ('requestIdleCallback' in window) window.requestIdleCallback(task, { timeout: IDLE_TIMEOUT_MS });
  else setTimeout(task, 0);
}
export const SONG_VOLUME = 0.2;
export const SONG_NOTICE_DURATION = 5;
export const SONGS = [{ path: 'sounds/musics/baram.mp3', name: '바람 · danwoo0' }] as const;
const AMBIENT_DISTANCE = 30;
export const FIRE_FADE_DISTANCE = 13;
export const HIT_FADE_DISTANCE = 20;
export const CRICKETS_VOLUME = 0.65;
export const MUTE_KEY = {
  name: 'mute',
  categories: ['intro', 'modal', 'menu', 'racing', 'cinematic', 'wandering'],
  keys: ['Keyboard.l'],
};
export const BIRD_TWEETS = [
  'sounds/birdTweets/24074 small bird tweet calling-full-1.mp3',
  'sounds/birdTweets/24074 small bird tweet calling-full-2.mp3',
  'sounds/birdTweets/20711 finch bird isolated tweet-full.mp3',
  'sounds/birdTweets/30673 Yellowhammer bird tweet 3-full.mp3',
  'sounds/birdTweets/31062 Ortolan bird tweet-full.mp3',
  'sounds/birdTweets/31451 Ortolan bunting bird isolated tweet-full.mp3',
];
export const HIT_SOUNDS = {
  hitDefault: [
    ['sounds/hits/defaults/Stone_Hit_Crash_106-2.mp3', 0.35],
    ['sounds/hits/defaults/Stone_Hit_Crash_071-1.mp3', 0.35],
    ['sounds/hits/defaults/Stone_Hit_Crash_106-1.mp3', 0.35],
    ['sounds/hits/defaults/Impact Soft 01.mp3', 0.8],
    ['sounds/hits/defaults/Impact Soft 02.mp3', 0.8],
    ['sounds/hits/defaults/Impact Soft 03.mp3', 0.8],
    ['sounds/hits/defaults/Impact Soft 04.mp3', 0.8],
  ],
  hitBrick: [
    ['sounds/hits/bricks/24445 brick light hitting-full-2.mp3', 0.6],
    ['sounds/hits/bricks/41559 Stone brick fall hit 01-full-1.mp3', 0.6],
    ['sounds/hits/bricks/41563 Stone brick fall hit 05-full-1.mp3', 0.6],
    ['sounds/hits/bricks/BrickSetDown_BW.5803-1.mp3', 0.6],
  ],
  hitMetal: [
    ['sounds/hits/metal/EQUIPTact_Fire Gear_SDFIRE0411.mp3', 0.6],
    ['sounds/hits/metal/Metal Clip Hit.mp3', 0.6],
    ['sounds/hits/metal/Metalic 3.mp3', 0.6],
  ],
} as const satisfies Record<string, readonly (readonly [string, number])[]>;
export const HIT_GROUPS = [
  'hitDefault',
  'hitBrick',
  'hitMetal',
] as const satisfies readonly (keyof typeof HIT_SOUNDS)[];
function randomOffset(distance: number): number {
  return Math.random() < 0.5 ? distance : -distance;
}
export function randomNearbyPosition(distance = AMBIENT_DISTANCE): THREE.Vector3 {
  const { position } = getGame().view.focusPoint;
  return new THREE.Vector3(position.x + randomOffset(distance), position.y, position.z + randomOffset(distance));
}
export function closestTo(
  positions: readonly THREE.Vector3[],
  target: THREE.Vector3,
): { position: THREE.Vector3; distance: number } | null {
  let closest: { position: THREE.Vector3; distance: number } | null = null;
  for (const position of positions) {
    const distance = position.distanceTo(target);
    if (!closest || distance < closest.distance) closest = { position, distance };
  }
  return closest;
}

export function nowPlayingNotice(songName: string): HTMLElement {
  return createElement('div', 'top', [
    createElement('div', 'title', [
      '재생 중',
      document.createElement('br'),
      createElement('span', 'song-name', [songName]),
    ]),
    createElement('div', 'music-note-icon'),
  ]);
}
export function hitHandler(baseVolume: number, volumeOf: (force: number) => number): SoundHandler {
  return (item, force, position) => {
    if (typeof force !== 'number' || !isVectorLike(position)) return;
    item.firstPosition().copy(position);
    item.volume = baseVolume * volumeOf(force);
    item.rate = 0.9 + Math.random() * 0.2;
  };
}
export const HIT_VOLUME: Record<keyof typeof HIT_SOUNDS, (force: number) => number> = {
  hitDefault: (force) => remapClamp(force, [0, 200], [0, 1]),
  hitBrick: (force) => remapClamp(force, [5, 20], [0, 1]) ** 2,
  hitMetal: (force) => remapClamp(force, [5, 20], [0, 1]) ** 2,
};

export type MusicOwner = 'island' | 'jukebox';
