import type { HTMLAttributes } from 'react';

/** 시맨틱 팔레트를 소비하는 뱃지. tone별로 subtle 배경 + 같은 역할의 글자색을 쓴다. */
const TONE = {
  primary: 'bg-primary-subtle text-primary',
  secondary: 'bg-secondary-subtle text-secondary',
  success: 'bg-success-subtle text-success',
  error: 'bg-error-subtle text-error',
  warning: 'bg-warning-subtle text-warning',
  info: 'bg-info-subtle text-info',
} as const;

export type BadgeTone = keyof typeof TONE;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'primary', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-sm py-xs text-xs font-medium ${TONE[tone]} ${className}`}
      {...props}
    />
  );
}
