import type { ReactNode } from 'react';

const BADGE_TONE = {
  neutral: 'bg-input-bg text-gray-500',
  gold: 'bg-gold/10 text-gold',
  danger: 'bg-red/10 text-red',
} as const;

export type BadgeTone = keyof typeof BADGE_TONE;

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

export default function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ring-black/5 ${BADGE_TONE[tone]}`}
    >
      {children}
    </span>
  );
}
