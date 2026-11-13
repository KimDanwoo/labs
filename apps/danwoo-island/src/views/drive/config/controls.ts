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
  { keys: ['WASD', '방향키'], joiner: ' 또는 ', action: '이동' },
  { keys: ['SHIFT'], joiner: '', action: '부스트' },
  { keys: ['왼쪽 CTRL', 'B'], joiner: ' 또는 ', action: '브레이크' },
  { keys: ['SPACE'], joiner: '', action: '점프' },
  { keys: ['ENTER'], joiner: '', action: '상호작용' },
  { keys: ['M'], joiner: '', action: '지도' },
  { keys: ['L'], joiner: '', action: '음소거' },
  { keys: ['R'], joiner: '', action: '출발 지점으로' },
  { keys: ['숫자 키', '숫자 패드'], joiner: '/', action: '유압 서스펜션' },
  { keys: ['왼쪽 클릭 (드래그)'], joiner: '', action: '카메라 이동' },
  { keys: ['H'], joiner: '', action: '경적' },
];

export const TOUCH_CONTROLS: readonly KeyControl[] = [
  { keys: ['한 손가락'], joiner: '', action: '차 움직이기' },
  { keys: ['두 손가락'], joiner: '', action: '카메라 이동·확대' },
  { keys: ['차를 탭'], joiner: '', action: '점프' },
];

export const GAMEPAD_CONTROLS: readonly GamepadControl[] = [
  { kind: 'paired', xbox: 'B', playstation: { kind: 'icon', icon: 'circle' }, action: '부스트' },
  { kind: 'paired', xbox: 'Y', playstation: { kind: 'icon', icon: 'triangle' }, action: '점프' },
  { kind: 'paired', xbox: 'X', playstation: { kind: 'icon', icon: 'square' }, action: '브레이크' },
  { kind: 'paired', xbox: 'A', playstation: { kind: 'icon', icon: 'cross' }, action: '상호작용·나가기' },
  { kind: 'paired', xbox: 'LT', playstation: { kind: 'label', label: 'L2' }, action: '가속' },
  { kind: 'paired', xbox: 'RT', playstation: { kind: 'label', label: 'R2' }, action: '후진' },
  { kind: 'paired', xbox: 'LB / RB', playstation: { kind: 'label', label: 'L1 / R1' }, action: '유압 서스펜션' },
  { kind: 'shared', key: '왼쪽 스틱', action: '조향' },
  { kind: 'shared', key: '왼쪽 스틱 누르기', action: '경적' },
  { kind: 'shared', key: '오른쪽 스틱', action: '카메라 이동' },
  { kind: 'shared', key: '오른쪽 스틱 누르기', action: '확대·축소' },
  { kind: 'shared', key: 'Select', action: '초기화' },
  { kind: 'shared', key: 'Start', action: '일시정지' },
];
