/**
 * 그림자 토큰 — 카드/버튼의 입체(elevation)와 brand glow 강조에 쓰는 스케일.
 * 테마와 무관한 단일 값으로 정의한다(글래스 표면 + 보더가 다크에서도 깊이를 보완).
 */
export const shadow = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 16px -4px rgba(0, 0, 0, 0.1), 0 2px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 16px 40px -12px rgba(0, 0, 0, 0.18), 0 6px 16px -6px rgba(0, 0, 0, 0.08)',
  glow: '0 12px 32px -8px rgba(2, 132, 199, 0.35)',
  'glow-lg': '0 24px 64px -16px rgba(2, 132, 199, 0.45)',
} as const;

export type ShadowToken = keyof typeof shadow;
