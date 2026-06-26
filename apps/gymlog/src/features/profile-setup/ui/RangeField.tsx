'use client';

type RangeFieldProps = {
  label: string;
  options: readonly number[];
  value: number;
  getLabel: (value: number) => string;
  onSelect: (value: number) => void;
};

// 이산 옵션을 슬라이더로 — 휴식 시간처럼 순서가 있는 값에 어울린다.
export function RangeField({ label, options, value, getLabel, onSelect }: RangeFieldProps) {
  const index = Math.max(0, options.indexOf(value));
  const first = options[0] ?? value;
  const last = options[options.length - 1] ?? value;

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        <span className="font-display text-2xl font-bold text-foreground">{getLabel(value)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={options.length - 1}
        step={1}
        value={index}
        onChange={(event) => onSelect(options[Number(event.target.value)] ?? value)}
        aria-label={label}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted">
        <span>{getLabel(first)}</span>
        <span>{getLabel(last)}</span>
      </div>
    </div>
  );
}
