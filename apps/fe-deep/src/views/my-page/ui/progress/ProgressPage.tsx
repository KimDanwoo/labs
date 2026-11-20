'use client';

import { Progress } from '@views/my-page/ui/progress/progress';

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
