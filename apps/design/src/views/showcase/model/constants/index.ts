import type { BadgeTone, ButtonVariant } from '@ui/react';

/** 시맨틱 색 역할 — 색 토큰을 역할별로 묶어 보여줄 때 기준. */
export const SEMANTIC_ROLES = ['primary', 'secondary', 'success', 'error', 'warning', 'info'] as const;

/** @ui/react Button 변형 전량. */
export const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost'];

/** @ui/react Badge 톤 전량. */
export const BADGE_TONES: BadgeTone[] = ['primary', 'secondary', 'success', 'error', 'warning', 'info'];
