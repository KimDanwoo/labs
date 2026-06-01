/**
 * 여백 토큰 — padding/margin/gap 등에 쓰이는 스케일 맵.
 */
export const spacing = {
  none: '0px',
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

export const radius = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

/**
 * 컨테이너(최대 폭) 토큰 — 읽기 좋은 본문 폭 등.
 * spacing 토큰이 Tailwind의 `max-w-{sm~3xl}` 이름을 가리므로, 충돌 없는 이름으로 둔다.
 * `--container-content` → `max-w-content` 유틸 생성.
 */
export const container = {
  content: '42rem',
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type ContainerToken = keyof typeof container;
