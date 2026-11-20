import { ConfirmSheet } from '@views/slitherlink/ui/ConfirmSheet';
import { ResultSheet } from '@views/slitherlink/ui/ResultSheet';
import { SlitherlinkBackdrop } from '@views/slitherlink/ui/SlitherlinkBackdrop';
import { SlitherlinkBoard } from '@views/slitherlink/ui/SlitherlinkBoard';
import { SlitherlinkMobilePanel } from '@views/slitherlink/ui/SlitherlinkMobilePanel';
import { SlitherlinkRoot } from '@views/slitherlink/ui/SlitherlinkRoot';
import { SlitherlinkSidePanel } from '@views/slitherlink/ui/SlitherlinkSidePanel';
import { SlitherlinkStatus } from '@views/slitherlink/ui/SlitherlinkStatus';
import { WrongLoopNotice } from '@views/slitherlink/ui/WrongLoopNotice';

export const SlitherlinkGame = {
  Root: SlitherlinkRoot,
  Backdrop: SlitherlinkBackdrop,
  Status: SlitherlinkStatus,
  Board: SlitherlinkBoard,
  Notice: WrongLoopNotice,
  SidePanel: SlitherlinkSidePanel,
  MobilePanel: SlitherlinkMobilePanel,
  ResultSheet,
  ConfirmSheet,
};
