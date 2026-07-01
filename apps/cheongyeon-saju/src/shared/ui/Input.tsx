import { cn } from '@shared/lib/cn';

import { inputBase } from './styles';

type InputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  inputMode?: 'text' | 'numeric';
  min?: number;
  max?: number;
  suffix?: string;
  className?: string;
};

export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  min,
  max,
  suffix,
  className,
}: InputProps) {
  if (!suffix) {
    return (
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className={cn(inputBase, className)}
      />
    );
  }

  return (
    <div className="relative">
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className={cn(inputBase, 'pr-8 text-center', className)}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted pointer-events-none">
        {suffix}
      </span>
    </div>
  );
}
