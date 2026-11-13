import type { BadgeVariant, ButtonVariant } from '@ui/react';

export const SEMANTIC_ROLES = ['primary', 'secondary', 'success', 'error', 'warning', 'info'] as const;

export const BUTTON_VARIANTS: ButtonVariant[] = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'];

export const BADGE_VARIANTS: BadgeVariant[] = [
  'default',
  'secondary',
  'destructive',
  'outline',
  'success',
  'warning',
  'info',
];
