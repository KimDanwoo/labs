import type { ButtonState } from './gamepadMapping';
import { INPUT_MODE } from './inputTypes';
import type { Inputs } from './inputs';

export function listenKeyboard(inputs: Inputs): void {
  inputs.keyboard.events.on('down', (code, key) => {
    inputs.updateMode(INPUT_MODE.mouseKeyboard);
    inputs.start(`Keyboard.${code}`);
    inputs.start(`Keyboard.${key}`);
  });
  inputs.keyboard.events.on('up', (code, key) => {
    inputs.updateMode(INPUT_MODE.mouseKeyboard);
    inputs.end(`Keyboard.${code}`);
    inputs.end(`Keyboard.${key}`);
  });
}

export function listenGamepad(inputs: Inputs): void {
  const gamepadKey = (button: ButtonState): string => `Gamepad.${button.name}`;
  inputs.gamepad.events.on('down', (button) => {
    inputs.updateMode(INPUT_MODE.gamepad);
    inputs.start(gamepadKey(button), button.value);
  });
  inputs.gamepad.events.on('up', (button) => {
    inputs.updateMode(INPUT_MODE.gamepad);
    inputs.end(gamepadKey(button));
  });
  inputs.gamepad.events.on('typeChange', () => inputs.updateMode(INPUT_MODE.gamepad));
  inputs.gamepad.events.on('change', (button) => {
    inputs.updateMode(INPUT_MODE.gamepad);
    inputs.change(gamepadKey(button), button.value);
  });
}

export function listenWheel(inputs: Inputs): void {
  inputs.wheel.events.on('roll', (spin) => {
    inputs.updateMode(INPUT_MODE.mouseKeyboard);
    inputs.pulse('Wheel.roll', spin);
  });
}
