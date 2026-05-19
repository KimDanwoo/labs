import { cn } from '@shared/lib/cn';

import { inputBase } from './styles';

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
};

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
}: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(inputBase, 'appearance-none', className)}
    >
      {placeholder && (
        <option value="" disabled className="bg-card-bg text-muted">
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-card-bg">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
