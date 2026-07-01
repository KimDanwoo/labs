import { TWELVE_STAGE_TABLE } from '../data/twelveStages';
import type { FourPillars, TwelveStage } from '../model/types';

type TwelveStageAnalysis = {
  yearBranch: TwelveStage;
  monthBranch: TwelveStage;
  dayBranch: TwelveStage;
  hourBranch: TwelveStage;
};

function analyzeTwelveStages(fourPillars: FourPillars): TwelveStageAnalysis {
  const dayStem = fourPillars.day.stem;
  const stageMap = TWELVE_STAGE_TABLE[dayStem];

  return {
    yearBranch: stageMap[fourPillars.year.branch],
    monthBranch: stageMap[fourPillars.month.branch],
    dayBranch: stageMap[fourPillars.day.branch],
    hourBranch: stageMap[fourPillars.hour.branch],
  };
}

export type { TwelveStageAnalysis };
export { analyzeTwelveStages };
