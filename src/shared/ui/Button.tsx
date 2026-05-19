import { cn } from '@shared/lib/cn';

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
};

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center h-12 px-6 rounded-lg font-medium text-base transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none';

  const variantStyles = {
    primary:
      'bg-gold text-background hover:bg-gold-bright active:scale-[0.98] shadow-lg shadow-gold/20',
    secondary:
      'bg-transparent border border-gold text-gold hover:bg-gold/10 active:scale-[0.98]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(baseStyles, variantStyles[variant], className)}
    >
      {children}
    </button>
  );
}
