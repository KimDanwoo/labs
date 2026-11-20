export const SHEET_BUTTON_VARIANT = {
  primary:
    'bg-linear-to-b from-gradient-from to-gradient-to font-semibold text-white shadow-lg shadow-gradient-from/30 hover:brightness-110',
  secondary: 'border border-border-light bg-bg-tertiary font-normal text-text-primary hover:bg-surface-tertiary',
} as const;

export type SheetButtonVariant = keyof typeof SHEET_BUTTON_VARIANT;
