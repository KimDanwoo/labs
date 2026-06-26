'use client';

import { Button } from '@ui/react';

type RepStepperProps = {
  value: number;
  onChange: (value: number) => void;
};

export function RepStepper({ value, onChange }: RepStepperProps) {
  const handleDecrease = () => {
    onChange(Math.max(0, value - 1));
  };

  const handleIncrease = () => {
    onChange(value + 1);
  };

  return (
    <div className="flex items-center justify-between gap-md">
      <Button variant="outline" className="h-14 w-14 text-xl font-bold" onClick={handleDecrease}>
        −
      </Button>
      <div className="flex flex-1 flex-col items-center">
        <span className="font-display text-4xl font-bold text-foreground">{value}</span>
        <span className="text-sm text-muted">회</span>
      </div>
      <Button variant="outline" className="h-14 w-14 text-xl font-bold" onClick={handleIncrease}>
        +
      </Button>
    </div>
  );
}
