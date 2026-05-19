import { cn } from '@shared/lib/cn';

type ToggleOption<T extends string> = {
  value: T;
  label: string;
};

type ToggleGroupProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: ToggleOption<T>[];
  className?: string;
};

export function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
  className,
}: ToggleGroupProps<T>) {
  return (
    <div className={cn('flex gap-2', className)}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 py-3 rounded-xl text-sm font-semibold',
              'transition-all duration-200 cursor-pointer border',
              isActive
                ? 'bg-gold text-[#0a0a1a] border-gold shadow-lg shadow-gold/20'
                : 'bg-white/5 text-foreground border-gold/30 hover:border-gold/60',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
