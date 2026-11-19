'use client';

import { Progress } from './progress';

export function ProgressPage() {
  return (
    <Progress.Root>
      <Progress.Intro />
      <Progress.Streak />
      <Progress.Heatmap />
      <Progress.Stats />
      <Progress.Overall />
      <Progress.Categories />
    </Progress.Root>
  );
}
