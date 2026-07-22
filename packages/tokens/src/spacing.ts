/**
 * 여백 토큰 — padding/margin/gap 등에 쓰이는 스케일 맵.
 *
 * ⚠️ `none` 키 금지: `--spacing-none`을 정의하면 Tailwind v4가 `none`을 spacing 값으로
 * 등록해 `max-w-none`이 `max-width: var(--spacing-none)`(=0)로 재생성되어 코어의
 * `max-width: none`(제한 없음)을 덮어쓴다 → 폭 붕괴. 0 여백은 `-0` 유틸을 쓴다.
 */
export const spacing = {
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
  xl: '16px',
  full: '9999px',
} as const;

/**
 * 컨테이너(최대 폭) 토큰 → `max-w-*` 유틸.
 *
 * ⚠️ Tailwind v4 함정(검증됨): spacing 토큰과 **이름이 겹치는** container 키
 * (xs·sm·md·lg·xl·2xl·3xl)는 `--container-*`를 정의해도 `max-w-md` 등이 여전히
 * `--spacing-md`(아주 작은 값)로 해석돼 폭이 붕괴한다. 즉 max-w 유틸로 안전하게
 * 쓸 수 있는 건 **spacing과 겹치지 않는 이름뿐**이다: `content`(읽기 폭 42rem),
 * `mobile`(폰 앱 폭 448rem) 등. 겹치는 스텝은 아래에 값으로만 남겨두되 max-w엔 쓰지 않는다.
 */
export const container = {
  '3xs': '16rem',
  '2xs': '18rem',
  xs: '20rem',
  sm: '24rem',
  md: '28rem',
  lg: '32rem',
  xl: '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
  '6xl': '72rem',
  '7xl': '80rem',
  mobile: '28rem', // 폰 앱(gymlog 등) 콘텐츠 폭 — spacing과 안 겹쳐 max-w-mobile로 안전.
  content: '42rem', // 읽기 앱(fe-deep·hub) 본문 폭.
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type ContainerToken = keyof typeof container;
