import { CapturedSheet } from '@views/gostop/ui/CapturedSheet';
import { DecideSheet } from '@views/gostop/ui/DecideSheet';
import { GostopActions } from '@views/gostop/ui/GostopActions';
import { GostopAnnouncer } from '@views/gostop/ui/GostopAnnouncer';
import { GostopBonus } from '@views/gostop/ui/GostopBonus';
import { GostopCutIn } from '@views/gostop/ui/GostopCutIn';
import { GostopDeal } from '@views/gostop/ui/GostopDeal';
import { GostopFloor } from '@views/gostop/ui/GostopFloor';
import { GostopHand } from '@views/gostop/ui/GostopHand';
import { GostopMenu } from '@views/gostop/ui/GostopMenu';
import { GostopMine } from '@views/gostop/ui/GostopMine';
import { GostopRecord } from '@views/gostop/ui/GostopRecord';
import { GostopRival } from '@views/gostop/ui/GostopRival';
import { GostopRoot } from '@views/gostop/ui/GostopRoot';
import { GostopRule } from '@views/gostop/ui/GostopRule';
import { GostopSettings } from '@views/gostop/ui/GostopSettings';
import { GostopSide } from '@views/gostop/ui/GostopSide';
import { GostopStatus } from '@views/gostop/ui/GostopStatus';
import { GostopTable } from '@views/gostop/ui/GostopTable';
import { ResultSheet } from '@views/gostop/ui/ResultSheet';

export const Gostop = {
  Root: GostopRoot,
  Status: GostopStatus,
  Settings: GostopSettings,
  Menu: GostopMenu,
  Table: GostopTable,
  Rival: GostopRival,
  Floor: GostopFloor,
  Mine: GostopMine,
  Hand: GostopHand,
  Deal: GostopDeal,
  CutIn: GostopCutIn,
  Side: GostopSide,
  Actions: GostopActions,
  Rule: GostopRule,
  Record: GostopRecord,
  Announcer: GostopAnnouncer,
  Bonus: GostopBonus,
  DecideSheet,
  CapturedSheet,
  ResultSheet,
};
