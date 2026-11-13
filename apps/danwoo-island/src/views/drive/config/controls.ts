export interface KeyControl {
  keys: readonly string[];
  joiner: string;
  action: string;
}

export type PlaystationButton =
  | { kind: 'icon'; icon: 'circle' | 'triangle' | 'square' | 'cross' }
  | { kind: 'label'; label: string };

export type GamepadControl =
  | { kind: 'paired'; xbox: string; playstation: PlaystationButton; action: string }
  | { kind: 'shared'; key: string; action: string };

export const KEYBOARD_CONTROLS: readonly KeyControl[] = [
  { keys: ['WASD', 'ARROWS'], joiner: ' or ', action: 'Move around' },
  { keys: ['SHIFT'], joiner: '', action: 'Boost' },
  { keys: ['CTRL LEFT', 'B'], joiner: ' or ', action: 'Brake' },
  { keys: ['SPACE'], joiner: '', action: 'Jump' },
  { keys: ['ENTER'], joiner: '', action: 'Interact' },
  { keys: ['M'], joiner: '', action: 'Map' },
  { keys: ['L'], joiner: '', action: 'Mute' },
  { keys: ['R'], joiner: '', action: 'Respawn' },
  { keys: ['NUM KEYS', 'NUM PAD'], joiner: '/', action: 'Activate hydraulics' },
  { keys: ['LEFT CLICK (DRAG)'], joiner: '', action: 'Move camera' },
  { keys: ['H'], joiner: '', action: 'Honk' },
];

export const TOUCH_CONTROLS: readonly KeyControl[] = [
  { keys: ['One finger'], joiner: '', action: 'Move the car' },
  { keys: ['Two fingers'], joiner: '', action: 'Move camera / zoom' },
  { keys: ['Tap (on the car)'], joiner: '', action: 'Jump' },
];

export const GAMEPAD_CONTROLS: readonly GamepadControl[] = [
  { kind: 'paired', xbox: 'B', playstation: { kind: 'icon', icon: 'circle' }, action: 'Boost' },
  { kind: 'paired', xbox: 'Y', playstation: { kind: 'icon', icon: 'triangle' }, action: 'Jump' },
  { kind: 'paired', xbox: 'X', playstation: { kind: 'icon', icon: 'square' }, action: 'Brake' },
  { kind: 'paired', xbox: 'A', playstation: { kind: 'icon', icon: 'cross' }, action: 'Interact / Exit' },
  { kind: 'paired', xbox: 'LT', playstation: { kind: 'label', label: 'L2' }, action: 'Accelerate' },
  { kind: 'paired', xbox: 'RT', playstation: { kind: 'label', label: 'R2' }, action: 'Backward accelerate' },
  { kind: 'paired', xbox: 'LB / RB', playstation: { kind: 'label', label: 'L1 / R1' }, action: 'Hydraulics' },
  { kind: 'shared', key: 'Joystick Left', action: 'Turn wheels' },
  { kind: 'shared', key: 'Joystick Left (press)', action: 'Honk' },
  { kind: 'shared', key: 'Joystick Right', action: 'Move camera' },
  { kind: 'shared', key: 'Joystick Right (press)', action: 'Zoom in/out' },
  { kind: 'shared', key: 'Select', action: 'Reset' },
  { kind: 'shared', key: 'Start', action: 'Pause' },
];
