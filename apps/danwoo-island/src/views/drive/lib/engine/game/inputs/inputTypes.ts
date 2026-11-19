import type { SetChange } from '../utilities/observableSet';

export const INPUT_MODE = { mouseKeyboard: 1, gamepad: 2, touch: 3 } as const;
export type InputMode = (typeof INPUT_MODE)[keyof typeof INPUT_MODE];

export interface PointValue {
  x: number;
  y: number;
}

export type ActionValue = number | PointValue;
export type ActionTrigger = 'start' | 'change' | 'end';

export interface ActionDefinition {
  name: string;
  categories: readonly string[];
  keys: readonly string[];
}

export interface Action extends ActionDefinition {
  active: boolean;
  value: ActionValue;
  trigger: ActionTrigger | null;
  activeKeys: Set<string>;
}
export const MODE_CLASS = {
  [INPUT_MODE.mouseKeyboard]: 'mouse-keyboard',
  [INPUT_MODE.gamepad]: 'gamepad',
  [INPUT_MODE.touch]: 'touch',
} satisfies Record<InputMode, string>;
export const NIPPLE_ACTION: ActionDefinition = {
  name: 'nipplePointer',
  categories: ['wandering', 'racing'],
  keys: ['Pointer.any'],
};
const filterClass = (filter: string): string => `input-filter-${filter}`;
export function reflectFilterChange(change: SetChange<string>): void {
  const { classList } = document.documentElement;
  if (change.type === 'add') classList.add(filterClass(change.value));
  if (change.type === 'delete') classList.remove(filterClass(change.value));
  if (change.type === 'clear') for (const value of change.previousValues) classList.remove(filterClass(value));
}
export function isSameValue(current: ActionValue, next: ActionValue): boolean {
  if (typeof current === 'number' || typeof next === 'number') return current === next;
  return current.x === next.x && current.y === next.y;
}
