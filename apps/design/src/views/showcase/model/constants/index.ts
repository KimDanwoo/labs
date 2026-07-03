import type { BadgeVariant, ButtonVariant } from '@ui/react';

/** 시맨틱 색 역할 — 색 토큰을 역할별로 묶어 보여줄 때 기준. */
export const SEMANTIC_ROLES = ['primary', 'secondary', 'success', 'error', 'warning', 'info'] as const;

/** @ui/react Button 변형(대표). */
export const BUTTON_VARIANTS: ButtonVariant[] = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'];

/** @ui/react Badge 변형(대표) — solid + 시맨틱 상태 톤. */
export const BADGE_VARIANTS: BadgeVariant[] = ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info'];
