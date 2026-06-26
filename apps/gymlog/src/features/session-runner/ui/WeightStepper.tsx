'use client';

import { Button } from '@ui/react';

const STEP = 5;
const FINE_STEP = 2.5;

type WeightStepperProps = {
  value: number;
  onChange: (value: number) => void;
};

export function WeightStepper({ value, onChange }: WeightStepperProps) {
  const adjust = (delta: number) => onChange(Math.max(0, value + delta));

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex items-center justify-between gap-md">
        <Button
          variant="outline"
          className="h-14 w-16 whitespace-nowrap text-base font-bold"
          onClick={() => adjust(-STEP)}
        >
          −{STEP}
        </Button>
        <div className="flex flex-1 flex-col items-center">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={FINE_STEP}
            value={value}
            onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
            onFocus={(event) => event.target.select()}
            aria-label="무게(kg)"
            className="font-display w-28 bg-transparent text-center text-4xl font-bold text-foreground outline-none"
          />
          <span className="text-sm text-muted">kg · 직접 입력 가능</span>
        </div>
        <Button
          variant="outline"
          className="h-14 w-16 whitespace-nowrap text-base font-bold"
          onClick={() => adjust(STEP)}
        >
          +{STEP}
        </Button>
      </div>

      <div className="flex gap-sm">
        <Button variant="ghost" className="h-10 flex-1 text-sm" onClick={() => adjust(-FINE_STEP)}>
          −{FINE_STEP}
        </Button>
        <Button variant="ghost" className="h-10 flex-1 text-sm" onClick={() => adjust(FINE_STEP)}>
          +{FINE_STEP}
        </Button>
      </div>
    </div>
  );
}
