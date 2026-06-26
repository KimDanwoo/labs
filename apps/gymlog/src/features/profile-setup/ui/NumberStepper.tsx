'use client';

type NumberStepperProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
};

const BTN = 'flex h-12 w-12 items-center justify-center rounded-md text-2xl font-semibold transition-colors';

export function NumberStepper({ value, min, max, step = 1, suffix = '', onChange }: NumberStepperProps) {
  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div className="flex items-center justify-between rounded-lg border border-card-border bg-glass p-md backdrop-blur-md">
      <button
        type="button"
        onClick={decrement}
        disabled={atMin}
        aria-label="감소"
        className={`${BTN} ${atMin ? 'text-muted opacity-40' : 'text-foreground hover:bg-primary-subtle'}`}
      >
        −
      </button>
      <span className="font-display text-2xl font-bold text-foreground">
        {value}
        {suffix && <span className="ml-xs text-base font-medium text-muted">{suffix}</span>}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={atMax}
        aria-label="증가"
        className={`${BTN} ${atMax ? 'text-muted opacity-40' : 'text-foreground hover:bg-primary-subtle'}`}
      >
        +
      </button>
    </div>
  );
}
