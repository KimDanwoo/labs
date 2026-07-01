import { cn } from '@shared/lib/cn';

import { inputBase } from './styles';

type TextareaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
};

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
}: TextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(inputBase, 'resize-none', className)}
    />
  );
}
