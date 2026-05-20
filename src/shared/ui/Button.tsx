import { cn } from '@shared/lib/cn';

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'ghost' | 'outline';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
};

const VARIANT_STYLES = {
  primary: cn(
    'h-13 bg-gold text-[#0a0a1a] font-bold tracking-wide',
    'shadow-lg shadow-gold/20',
    'hover:bg-gold-bright active:scale-[0.97]',
  ),
  ghost: cn(
    'h-10 px-8 text-sm text-gray-400 bg-transparent',
    'active:scale-[0.97]',
  ),
  outline: cn(
    'h-11 border border-gold/40 text-gold text-sm font-medium bg-transparent',
    'active:scale-[0.97]',
  ),
};

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  className,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'transition-all duration-200 cursor-pointer touch-manipulation',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        fullWidth && 'w-full',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
