export const SHEET_BUTTON_VARIANT = {
  primary: 'bg-primary font-semibold text-on-primary hover:brightness-110',
  secondary: 'border border-border-light bg-bg-tertiary font-normal text-text-primary hover:bg-surface-tertiary',
} as const;

export type SheetButtonVariant = keyof typeof SHEET_BUTTON_VARIANT;
