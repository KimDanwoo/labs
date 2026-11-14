import { Events } from '../events';
import { getGame } from '../gameContext';
import { ObservableSet, type SetChange } from '../utilities/observableSet';
import { type ButtonState, Gamepad } from './gamepad';
import { InteractiveButtons } from './interactiveButtons';
import { Keyboard } from './keyboard';
import { Nipple } from './nipple';
import { Pointer } from './pointer';
import { Wheel } from './wheel';

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

const MODE_CLASS = {
  [INPUT_MODE.mouseKeyboard]: 'mouse-keyboard',
  [INPUT_MODE.gamepad]: 'gamepad',
  [INPUT_MODE.touch]: 'touch',
} satisfies Record<InputMode, string>;
const TICK_ORDER = 0;
const NIPPLE_ACTION: ActionDefinition = {
  name: 'nipplePointer',
  categories: ['wandering', 'racing'],
  keys: ['Pointer.any'],
};

const filterClass = (filter: string): string => `input-filter-${filter}`;

function reflectFilterChange(change: SetChange<string>): void {
  const { classList } = document.documentElement;
  if (change.type === 'add') classList.add(filterClass(change.value));
  if (change.type === 'delete') classList.remove(filterClass(change.value));
  if (change.type === 'clear') for (const value of change.previousValues) classList.remove(filterClass(value));
}

function isSameValue(current: ActionValue, next: ActionValue): boolean {
  if (typeof current === 'number' || typeof next === 'number') return current === next;
  return current.x === next.x && current.y === next.y;
}

export class Inputs {
  static readonly MODE_MOUSEKEYBOARD = INPUT_MODE.mouseKeyboard;
  static readonly MODE_GAMEPAD = INPUT_MODE.gamepad;
  static readonly MODE_TOUCH = INPUT_MODE.touch;

  readonly game = getGame();
  readonly events = new Events<Record<string, [Action]>>();
  readonly modeEvents = new Events<{ change: [InputMode] }>();
  readonly actions = new Map<string, Action>();
  readonly filters = new ObservableSet<string>(reflectFilterChange);
  mode: InputMode = INPUT_MODE.mouseKeyboard;
  readonly keyboard = new Keyboard();
  readonly gamepad = new Gamepad();
  readonly pointer = new Pointer(this.game.canvasElement);
  readonly wheel = new Wheel();
  readonly interactiveButtons = new InteractiveButtons();
  readonly nipple = new Nipple();

  constructor(actions: readonly ActionDefinition[] = [], filters: readonly string[] = []) {
    this.#listenKeyboard();
    this.#listenGamepad();
    this.#listenPointer();
    this.#listenWheel();
    this.#listenNipple();
    this.addActions(actions);
    for (const filter of filters) this.filters.add(filter);
    this.game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
    document.documentElement.classList.add(`is-mode-${MODE_CLASS[this.mode]}`);
  }

  addActions(definitions: readonly ActionDefinition[]): void {
    for (const definition of definitions) {
      this.actions.set(definition.name, {
        ...definition,
        active: false,
        value: 0,
        trigger: null,
        activeKeys: new Set(),
      });
    }
  }

  start(key: string, value: ActionValue = 1): void {
    for (const action of this.#press(key, value)) {
      if (action.active) continue;
      action.active = true;
      this.#emit('actionStart', action);
    }
  }

  pulse(key: string, value: ActionValue): void {
    for (const action of this.#press(key, value)) this.#emit('actionStart', action);
  }

  end(key: string, value: ActionValue = 0): void {
    for (const action of this.#actionsFor(key)) {
      if (!action.active) continue;
      action.activeKeys.delete(key);
      if (action.activeKeys.size > 0) continue;
      action.active = false;
      action.value = value;
      action.trigger = 'end';
      this.#emit('actionEnd', action);
    }
  }

  change(key: string, value: ActionValue = 1): void {
    for (const action of this.#actionsFor(key)) {
      if (!this.#isAllowed(action) || isSameValue(action.value, value)) continue;
      action.value = value;
      action.trigger = 'change';
      this.#emit('actionChange', action);
    }
  }

  updateMode(mode: InputMode): void {
    if (mode === this.mode) return;
    const { classList } = document.documentElement;
    classList.remove(`is-mode-${MODE_CLASS[this.mode]}`);
    this.mode = mode;
    classList.add(`is-mode-${MODE_CLASS[mode]}`);
    if (mode === INPUT_MODE.touch) this.interactiveButtons.activate();
    else this.interactiveButtons.deactivate();
    this.modeEvents.trigger('change', mode);
  }

  update(): void {
    this.pointer.update();
    this.gamepad.update();
    this.nipple.update();
  }

  clearInteractiveButtons(): void {
    this.interactiveButtons.clearItems();
  }

  #actionsFor(key: string): Action[] {
    return [...this.actions.values()].filter((action) => action.keys.includes(key));
  }

  #press(key: string, value: ActionValue): Action[] {
    const pressed = this.#actionsFor(key).filter((action) => this.#isAllowed(action));
    for (const action of pressed) {
      action.value = value;
      action.activeKeys.add(key);
      action.trigger = 'start';
    }
    return pressed;
  }

  #isAllowed(action: Action): boolean {
    if (this.filters.size === 0 || action.categories.length === 0) return true;
    return action.categories.some((category) => this.filters.has(category));
  }

  #emit(phase: 'actionStart' | 'actionEnd' | 'actionChange', action: Action): void {
    this.events.trigger(phase, action);
    this.events.trigger(action.name, action);
  }

  #pointerMode(): InputMode {
    return this.pointer.mode === Pointer.MODE_MOUSE ? INPUT_MODE.mouseKeyboard : INPUT_MODE.touch;
  }

  #pointerPosition(): PointValue {
    return { x: this.pointer.current.x, y: this.pointer.current.y };
  }

  #listenKeyboard(): void {
    this.keyboard.events.on('down', (code, key) => {
      this.updateMode(INPUT_MODE.mouseKeyboard);
      this.start(`Keyboard.${code}`);
      this.start(`Keyboard.${key}`);
    });
    this.keyboard.events.on('up', (code, key) => {
      this.updateMode(INPUT_MODE.mouseKeyboard);
      this.end(`Keyboard.${code}`);
      this.end(`Keyboard.${key}`);
    });
  }

  #listenGamepad(): void {
    const gamepadKey = (button: ButtonState): string => `Gamepad.${button.name}`;
    this.gamepad.events.on('down', (button) => {
      this.updateMode(INPUT_MODE.gamepad);
      this.start(gamepadKey(button), button.value);
    });
    this.gamepad.events.on('up', (button) => {
      this.updateMode(INPUT_MODE.gamepad);
      this.end(gamepadKey(button));
    });
    this.gamepad.events.on('typeChange', () => this.updateMode(INPUT_MODE.gamepad));
    this.gamepad.events.on('change', (button) => {
      this.updateMode(INPUT_MODE.gamepad);
      this.change(gamepadKey(button), button.value);
    });
  }

  #listenPointer(): void {
    this.pointer.events.on('down', () => {
      this.updateMode(this.#pointerMode());
      this.start('Pointer.any', this.#pointerPosition());
    });
    this.pointer.events.on('up', () => {
      this.updateMode(this.#pointerMode());
      this.end('Pointer.any', this.#pointerPosition());
    });
    this.pointer.events.on('move', () => this.change('Pointer.any', this.#pointerPosition()));
  }

  #listenWheel(): void {
    this.wheel.events.on('roll', (spin) => {
      this.updateMode(INPUT_MODE.mouseKeyboard);
      this.pulse('Wheel.roll', spin);
    });
  }

  #listenNipple(): void {
    this.addActions([NIPPLE_ACTION]);
    this.events.on(NIPPLE_ACTION.name, (action) => {
      if (this.mode !== INPUT_MODE.touch || !action.trigger) return;
      this.nipple.updateFromPointer(this.pointer, { trigger: action.trigger });
    });
  }
}
