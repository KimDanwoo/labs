import { ResultSheet } from '@views/walls/ui/ResultSheet';
import { WallsActions } from '@views/walls/ui/WallsActions';
import { WallsBoard } from '@views/walls/ui/WallsBoard';
import { WallsRoot } from '@views/walls/ui/WallsRoot';
import { WallsRule } from '@views/walls/ui/WallsRule';
import { WallsScore } from '@views/walls/ui/WallsScore';
import { WallsStatus } from '@views/walls/ui/WallsStatus';

export const Walls = {
  Root: WallsRoot,
  Status: WallsStatus,
  Board: WallsBoard,
  Score: WallsScore,
  Actions: WallsActions,
  Rule: WallsRule,
  ResultSheet,
};
