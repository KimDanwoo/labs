import { Events } from '../events';
import { remapClamp } from '../utilities/maths';

const BUTTON_NAMES = [
  'cross',
  'circle',
  'square',
  'triangle',
  'l1',
  'r1',
  'l2',
  'r2',
  'select',
  'start',
  'l3',
  'r3',
  'up',
  'down',
  'left',
  'right',
] as const;
const JOYSTICK_NAMES = ['left', 'right'] as const;

export type ButtonName = (typeof BUTTON_NAMES)[number];
export type JoystickName = (typeof JOYSTICK_NAMES)[number];
export type GamepadType = 'default' | 'xbox' | 'playstation';

type ButtonSource =
  | { action: 'buttonRaw'; index: number }
  | { action: 'axisToTrigger'; index: number }
  | { action: 'axisToArrow'; index: number; angles: readonly number[] };

interface GamepadMapping {
  buttons: Record<ButtonName, ButtonSource>;
  joysticks: Record<JoystickName, readonly [number, number]>;
}

export interface ButtonState {
  name: ButtonName;
  value: number;
  pressed: boolean;
}

export interface JoystickState {
  name: JoystickName;
  x: number;
  y: number;
  safeX: number;
  safeY: number;
  angle: number;
  radius: number;
  safeRadius: number;
  active: boolean;
}

const JOYSTICK_DEAD_ZONE = 0.2;
const BUTTON_PRESSED_ZONE = 0.2;
const ARROW_ANGLE_TOLERANCE = 0.1;
const FIREFOX_PS5_AXES = { windows: 10, macOS: 7 } as const;
const ARROW_ANGLES = {
  up: [-1, -0.7142857142857143, 1],
  down: [-0.1428571428571429, 0.1428571428571428, 0.4285714285714286],
  left: [0.4285714285714286, 0.7142857142857142, 1],
  right: [-0.7142857142857143, -0.4285714285714286, -0.1428571428571429],
} as const;

const raw = (index: number): ButtonSource => ({ action: 'buttonRaw', index });
const trigger = (index: number): ButtonSource => ({ action: 'axisToTrigger', index });
const arrow = (index: number, angles: readonly number[]): ButtonSource => ({ action: 'axisToArrow', index, angles });

const STANDARD_MAPPING: GamepadMapping = {
  buttons: {
    cross: raw(0),
    circle: raw(1),
    square: raw(2),
    triangle: raw(3),
    l1: raw(4),
    r1: raw(5),
    l2: raw(6),
    r2: raw(7),
    select: raw(8),
    start: raw(9),
    l3: raw(10),
    r3: raw(11),
    up: raw(12),
    down: raw(13),
    left: raw(14),
    right: raw(15),
  },
  joysticks: { left: [0, 1], right: [2, 3] },
};

interface FirefoxPs5Axes {
  triggers: readonly [number, number];
  arrows: number;
  rightStick: readonly [number, number];
}

function firefoxPs5Mapping({ triggers, arrows, rightStick }: FirefoxPs5Axes): GamepadMapping {
  return {
    buttons: {
      ...STANDARD_MAPPING.buttons,
      cross: raw(1),
      circle: raw(2),
      square: raw(0),
      l2: trigger(triggers[0]),
      r2: trigger(triggers[1]),
      up: arrow(arrows, ARROW_ANGLES.up),
      down: arrow(arrows, ARROW_ANGLES.down),
      left: arrow(arrows, ARROW_ANGLES.left),
      right: arrow(arrows, ARROW_ANGLES.right),
    },
    joysticks: { left: [0, 1], right: rightStick },
  };
}

const WINDOWS_FIREFOX_PS5 = firefoxPs5Mapping({ triggers: [3, 4], arrows: 9, rightStick: [2, 5] });
const MACOS_FIREFOX_PS5 = firefoxPs5Mapping({ triggers: [4, 5], arrows: 6, rightStick: [2, 3] });

function mappingFor(gamepad: globalThis.Gamepad): GamepadMapping {
  if (gamepad.mapping === 'standard') return STANDARD_MAPPING;
  if (gamepad.axes.length === FIREFOX_PS5_AXES.windows) return WINDOWS_FIREFOX_PS5;
  if (gamepad.axes.length === FIREFOX_PS5_AXES.macOS) return MACOS_FIREFOX_PS5;
  return STANDARD_MAPPING;
}

function buttonValue(gamepad: globalThis.Gamepad, source: ButtonSource): number {
  if (source.action === 'buttonRaw') return gamepad.buttons[source.index]?.value ?? 0;
  const axis = gamepad.axes[source.index];
  if (!axis) return 0;
  if (source.action === 'axisToTrigger') return axis * 0.5 + 0.5;
  return source.angles.some((angle) => Math.abs(angle - axis) < ARROW_ANGLE_TOLERANCE) ? 1 : 0;
}

const outsideDeadZone = (value: number): number => remapClamp(value, [JOYSTICK_DEAD_ZONE, 1], [0, 1]);

function joystickState(name: JoystickName, x: number, y: number): JoystickState {
  const radius = Math.hypot(y, x);
  return {
    name,
    x,
    y,
    safeX: outsideDeadZone(Math.abs(x)) * Math.sign(x),
    safeY: outsideDeadZone(Math.abs(y)) * Math.sign(y),
    angle: Math.atan2(y, x),
    radius,
    safeRadius: outsideDeadZone(radius),
    active: radius > JOYSTICK_DEAD_ZONE,
  };
}

function typeOf(gamepad: globalThis.Gamepad): GamepadType {
  if (/xbox/i.test(gamepad.id)) return 'xbox';
  if (/playstation|dualshock|dualsense|ps\d/i.test(gamepad.id)) return 'playstation';
  return 'default';
}

const lastConnected = (): globalThis.Gamepad | null =>
  navigator.getGamepads().reduce<globalThis.Gamepad | null>((found, gamepad) => gamepad ?? found, null);

export class Gamepad {
  readonly events = new Events<{
    down: [ButtonState];
    up: [ButtonState];
    change: [ButtonState];
    typeChange: [GamepadType];
  }>();
  type: GamepadType = 'default';
  readonly joysticks: Record<JoystickName, JoystickState> = {
    left: joystickState('left', 0, 0),
    right: joystickState('right', 0, 0),
  };
  readonly #buttons = new Map<ButtonName, ButtonState>(
    BUTTON_NAMES.map((name) => [name, { name, value: 0, pressed: false }]),
  );

  constructor() {
    document.documentElement.classList.add(`is-gamepad-${this.type}`);
  }

  update(): void {
    const gamepad = lastConnected();
    if (!gamepad) return;
    const mapping = mappingFor(gamepad);
    for (const button of this.#buttons.values())
      this.#updateButton(button, buttonValue(gamepad, mapping.buttons[button.name]));
    for (const name of JOYSTICK_NAMES) {
      const [xIndex, yIndex] = mapping.joysticks[name];
      Object.assign(this.joysticks[name], joystickState(name, gamepad.axes[xIndex] ?? 0, gamepad.axes[yIndex] ?? 0));
    }
    this.#updateType(typeOf(gamepad));
  }

  #updateButton(button: ButtonState, value: number): void {
    const { value: previousValue, pressed: wasPressed } = button;
    button.value = value;
    button.pressed = value > BUTTON_PRESSED_ZONE;
    if (button.pressed && !wasPressed) this.events.trigger('down', button);
    if (!button.pressed && wasPressed) this.events.trigger('up', button);
    if (value !== previousValue) this.events.trigger('change', button);
  }

  #updateType(type: GamepadType): void {
    if (type === this.type) return;
    document.documentElement.classList.replace(`is-gamepad-${this.type}`, `is-gamepad-${type}`);
    this.type = type;
    this.events.trigger('typeChange', type);
  }
}
