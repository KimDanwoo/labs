import { Events } from '../events';
import {
  type ButtonName,
  type ButtonState,
  type GamepadType,
  type JoystickName,
  type JoystickState,
  BUTTON_NAMES,
  BUTTON_PRESSED_ZONE,
  buttonValue,
  JOYSTICK_NAMES,
  joystickState,
  lastConnected,
  mappingFor,
  typeOf,
} from './gamepadMapping';

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
