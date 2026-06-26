'use client';

type PillGroupProps<T extends string | number> = {
  label: string;
  options: readonly T[];
  value: T;
  getLabel: (option: T) => string;
  onSelect: (option: T) => void;
  columns?: 2 | 3;
};

const COLS: Record<2 | 3, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
};

// 줄바꿈으로 깨지지 않는 정돈된 선택 그리드(라벨은 한 줄 유지).
export function PillGroup<T extends string | number>({
  label,
  options,
  value,
  getLabel,
  onSelect,
  columns = 2,
}: PillGroupProps<T>) {
  return (
    <div className="flex flex-col gap-sm">
      <span className="text-sm font-medium text-muted">{label}</span>
      <div className={`grid ${COLS[columns]} gap-sm`}>
        {options.map((option) => {
          const isSelected = option === value;
          const tone = isSelected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-card-border bg-glass text-foreground hover:border-primary';
          return (
            <button
              key={String(option)}
              type="button"
              onClick={() => onSelect(option)}
              className={`h-12 truncate rounded-lg border px-md text-sm font-medium transition-colors ${tone}`}
            >
              {getLabel(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
