export const MENU_SECTIONS = [
  { name: 'home', icon: 'ui/line/home.png' },
  { name: 'options', icon: 'ui/line/gear.png' },
  { name: 'controls', icon: 'ui/line/gamepad.png' },
  { name: 'circuit', icon: 'ui/line/flag.png' },
] as const;

export type MenuSectionName = (typeof MENU_SECTIONS)[number]['name'];

export const PAINT_OPTIONS = [
  { value: 'black', label: '검정' },
  { value: 'orange', label: '오렌지' },
  { value: 'white', label: '아이보리' },
  { value: 'red', label: '빨강' },
  { value: 'flames', label: '불꽃' },
  { value: 'abyssal', label: '별빛' },
] as const;

export const TOUCH_BUTTONS = [
  { name: 'interact', label: '확인' },
  { name: 'unstuck', label: '빼내기' },
  { name: 'previous', label: '' },
  { name: 'next', label: '' },
  { name: 'open', label: '' },
  { name: 'close', label: '' },
] as const;
