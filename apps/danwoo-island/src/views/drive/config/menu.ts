const LANDING_PREVIEW = 'danwoo/landing-preview.webp';

export const MENU_SECTIONS = [
  { name: 'home', icon: 'ui/home.svg', preview: LANDING_PREVIEW },
  { name: 'options', icon: 'ui/gear.svg', preview: LANDING_PREVIEW },
  { name: 'controls', icon: 'ui/controls/gamepad.svg', preview: LANDING_PREVIEW },
  { name: 'circuit', icon: 'ui/wheel.svg', preview: 'ui/previews/circuit.webp' },
  { name: 'behindTheScene', icon: 'ui/question.svg', preview: 'ui/previews/behindTheScene.webp' },
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
  { name: 'interact', label: 'Interact' },
  { name: 'unstuck', label: 'Unstuck' },
  { name: 'previous', label: '' },
  { name: 'next', label: '' },
  { name: 'open', label: '' },
  { name: 'close', label: '' },
] as const;
