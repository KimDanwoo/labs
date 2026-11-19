import { ProgressCategories } from './ProgressCategories';
import { ProgressHeatmap } from './ProgressHeatmap';
import { ProgressIntro } from './ProgressIntro';
import { ProgressOverall } from './ProgressOverall';
import { ProgressRoot } from './ProgressRoot';
import { ProgressStats } from './ProgressStats';
import { ProgressStreak } from './ProgressStreak';

export const Progress = {
  Root: ProgressRoot,
  Intro: ProgressIntro,
  Streak: ProgressStreak,
  Heatmap: ProgressHeatmap,
  Stats: ProgressStats,
  Overall: ProgressOverall,
  Categories: ProgressCategories,
};
