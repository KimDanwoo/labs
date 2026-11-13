export const shadow = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 16px -4px rgba(0, 0, 0, 0.1), 0 2px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 16px 40px -12px rgba(0, 0, 0, 0.18), 0 6px 16px -6px rgba(0, 0, 0, 0.08)',
  glow: '0 12px 32px -8px oklch(0.48 0.20 var(--brand-hue) / 0.35)',
} as const;

export type ShadowToken = keyof typeof shadow;
