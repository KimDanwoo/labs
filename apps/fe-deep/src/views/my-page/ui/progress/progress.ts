import { ProgressCategories } from '@views/my-page/ui/progress/ProgressCategories';
import { ProgressHeatmap } from '@views/my-page/ui/progress/ProgressHeatmap';
import { ProgressIntro } from '@views/my-page/ui/progress/ProgressIntro';
import { ProgressOverall } from '@views/my-page/ui/progress/ProgressOverall';
import { ProgressRoot } from '@views/my-page/ui/progress/ProgressRoot';
import { ProgressStats } from '@views/my-page/ui/progress/ProgressStats';
import { ProgressStreak } from '@views/my-page/ui/progress/ProgressStreak';

export const Progress = {
  Root: ProgressRoot,
  Intro: ProgressIntro,
  Streak: ProgressStreak,
  Heatmap: ProgressHeatmap,
  Stats: ProgressStats,
  Overall: ProgressOverall,
  Categories: ProgressCategories,
};
