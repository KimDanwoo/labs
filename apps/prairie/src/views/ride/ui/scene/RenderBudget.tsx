'use client';

import { useRenderBudget } from '../../model/hooks/useRenderBudget';

interface RenderBudgetProps {
  desired: number;
  pixels: number;
}

export function RenderBudget({ desired, pixels }: RenderBudgetProps) {
  useRenderBudget(desired, pixels);
  return null;
}
