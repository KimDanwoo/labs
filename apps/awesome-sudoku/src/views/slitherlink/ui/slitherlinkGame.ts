import { ConfirmSheet } from '@views/slitherlink/ui/ConfirmSheet';
import { GameControls } from '@views/slitherlink/ui/GameControls';
import { LevelSwitch } from '@views/slitherlink/ui/LevelSwitch';
import { ResultSheet } from '@views/slitherlink/ui/ResultSheet';
import { SlitherlinkBoard } from '@views/slitherlink/ui/SlitherlinkBoard';
import { SlitherlinkRoot } from '@views/slitherlink/ui/SlitherlinkRoot';
import { SlitherlinkRule } from '@views/slitherlink/ui/SlitherlinkRule';
import { SlitherlinkStatus } from '@views/slitherlink/ui/SlitherlinkStatus';

export const SlitherlinkGame = {
  Root: SlitherlinkRoot,
  Status: SlitherlinkStatus,
  Board: SlitherlinkBoard,
  Level: LevelSwitch,
  Controls: GameControls,
  Rule: SlitherlinkRule,
  ResultSheet,
  ConfirmSheet,
};
