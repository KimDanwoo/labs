import type { ButtonHTMLAttributes } from 'react';

const VARIANT = {
  primary: 'bg-primary text-primary-foreground shadow-sm hover:shadow-glow',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:opacity-90',
  outline: 'border border-glass-border bg-glass text-foreground backdrop-blur-sm hover:bg-primary-subtle',
  ghost: 'bg-transparent text-foreground hover:bg-primary-subtle',
} as const;

export type ButtonVariant = keyof typeof VARIANT;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-11 items-center justify-center rounded-md px-lg text-sm font-medium transition-[background-color,box-shadow,opacity] duration-200 ${VARIANT[variant]} ${className}`}
      {...props}
    />
  );
}
