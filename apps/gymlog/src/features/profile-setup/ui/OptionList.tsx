'use client';

type OptionListProps<T extends string | number> = {
  options: readonly T[];
  // null이면 아무것도 선택 안 됨(온보딩 기본값 없음).
  value: T | null;
  getLabel: (option: T) => string;
  getHint?: (option: T) => string | undefined;
  onSelect: (option: T) => void;
};

export function OptionList<T extends string | number>({
  options,
  value,
  getLabel,
  getHint,
  onSelect,
}: OptionListProps<T>) {
  return (
    <div className="flex flex-col gap-md">
      {options.map((option) => {
        const isSelected = option === value;
        const tone = isSelected
          ? 'border-primary bg-primary-subtle'
          : 'border-card-border bg-glass hover:border-primary';
        const hint = getHint?.(option);
        return (
          <button
            key={String(option)}
            type="button"
            onClick={() => onSelect(option)}
            className={`flex items-center justify-between rounded-lg border p-lg text-left backdrop-blur-md transition-colors ${tone}`}
          >
            <span className="flex flex-col gap-xs">
              <span className="text-lg font-semibold text-foreground">{getLabel(option)}</span>
              {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
            </span>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-card-border text-transparent'
              }`}
            >
              ✓
            </span>
          </button>
        );
      })}
    </div>
  );
}
