import type { AudioItem } from '@views/drive/lib/engine/game/audioItem';
import { getGame } from '@views/drive/lib/engine/game/gameContext';

export const WHEEL_COUNT = 4;
export const UNSTUCK_DELAY = 3;
export const DIE_RESPAWN_DELAY = 2;
export const HONK_DURATION = 0.15;
export const NIPPLE_JUMP_DURATION = 200;
export const NIPPLE_TRACKING_DELAY_FRAMES = 5;
export const NIPPLE_ACCELERATION_POWER = 3;
export const SPEED_LINES_SPEED = 15;
export const LANDING_SOUND_WHEELS = 1;
export const WHEELS_ON_FLOOR_ELEVATION = 1.08;
const DRIVE_CATEGORIES = ['wandering', 'racing', 'cinematic'];
const RACE_CATEGORIES = ['wandering', 'racing'];
export const FLY_CATEGORY = 'wandering';
export const SUSPENSION_ACTIONS = [
  'suspensions',
  'suspensionsFront',
  'suspensionsBack',
  'suspensionsRight',
  'suspensionsLeft',
  'suspensionsFrontLeft',
  'suspensionsFrontRight',
  'suspensionsBackRight',
  'suspensionsBackLeft',
] as const;
type SuspensionAction = (typeof SUSPENSION_ACTIONS)[number];
export const WHEEL_SUSPENSION_ACTIONS: readonly (readonly SuspensionAction[])[] = [
  ['suspensions', 'suspensionsFront', 'suspensionsRight', 'suspensionsFrontRight'],
  ['suspensions', 'suspensionsFront', 'suspensionsLeft', 'suspensionsFrontLeft'],
  ['suspensions', 'suspensionsBack', 'suspensionsRight', 'suspensionsBackRight'],
  ['suspensions', 'suspensionsBack', 'suspensionsLeft', 'suspensionsBackLeft'],
];
export const ACTIONS = [
  {
    name: 'forward',
    categories: DRIVE_CATEGORIES,
    keys: ['Keyboard.ArrowUp', 'Keyboard.KeyW', 'Gamepad.up', 'Gamepad.r2'],
  },
  { name: 'right', categories: DRIVE_CATEGORIES, keys: ['Keyboard.ArrowRight', 'Keyboard.KeyD', 'Gamepad.right'] },
  {
    name: 'backward',
    categories: DRIVE_CATEGORIES,
    keys: ['Keyboard.ArrowDown', 'Keyboard.KeyS', 'Gamepad.down', 'Gamepad.l2'],
  },
  { name: 'left', categories: DRIVE_CATEGORIES, keys: ['Keyboard.ArrowLeft', 'Keyboard.KeyA', 'Gamepad.left'] },
  { name: 'boost', categories: RACE_CATEGORIES, keys: ['Keyboard.ShiftLeft', 'Keyboard.ShiftRight', 'Gamepad.circle'] },
  { name: 'brake', categories: RACE_CATEGORIES, keys: ['Keyboard.KeyB', 'Keyboard.ControlLeft', 'Gamepad.square'] },
  { name: 'respawn', categories: ['wandering'], keys: ['Keyboard.KeyR', 'Gamepad.select'] },
  {
    name: 'suspensions',
    categories: RACE_CATEGORIES,
    keys: ['Keyboard.Numpad5', 'Keyboard.Space', 'Gamepad.triangle'],
  },
  { name: 'suspensionsFront', categories: RACE_CATEGORIES, keys: ['Keyboard.Numpad8'] },
  { name: 'suspensionsBack', categories: RACE_CATEGORIES, keys: ['Keyboard.Numpad2'] },
  { name: 'suspensionsRight', categories: RACE_CATEGORIES, keys: ['Keyboard.Numpad6', 'Gamepad.r1'] },
  { name: 'suspensionsLeft', categories: RACE_CATEGORIES, keys: ['Keyboard.Numpad4', 'Gamepad.l1'] },
  { name: 'suspensionsFrontLeft', categories: RACE_CATEGORIES, keys: ['Keyboard.Numpad7', 'Keyboard.Digit2'] },
  { name: 'suspensionsFrontRight', categories: RACE_CATEGORIES, keys: ['Keyboard.Numpad9', 'Keyboard.Digit3'] },
  { name: 'suspensionsBackRight', categories: RACE_CATEGORIES, keys: ['Keyboard.Numpad3', 'Keyboard.Digit4'] },
  { name: 'suspensionsBackLeft', categories: RACE_CATEGORIES, keys: ['Keyboard.Numpad1', 'Keyboard.Digit1'] },
  {
    name: 'interact',
    categories: DRIVE_CATEGORIES,
    keys: ['Keyboard.Enter', 'Keyboard.KeyE', 'Keyboard.KeyF', 'Gamepad.cross'],
  },
  { name: 'honk', categories: DRIVE_CATEGORIES, keys: ['Keyboard.KeyH', 'Gamepad.l3'] },
  { name: 'fly', categories: [FLY_CATEGORY], keys: ['Keyboard.KeyG', 'Gamepad.r3'] },
];
export const FLY_BUTTON = 'fly';
export interface PlayerSounds {
  suspensions: AudioItem;
  honk: AudioItem;
  spring1: AudioItem;
  spring2: AudioItem;
}
export function easeToward(item: AudioItem, volume: number, easing: { rising: number; falling: number }): void {
  const delta = volume - item.volume;
  item.volume += delta * getGame().ticker.deltaScaled * (delta > 0 ? easing.rising : easing.falling);
}
export function easeRate(item: AudioItem, rate: number): void {
  item.rate += (rate - item.rate) * getGame().ticker.deltaScaled * 5;
}
export function numberOrZero(value: unknown): number {
  return typeof value === 'number' ? value : 0;
}
