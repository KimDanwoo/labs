import { DecideSheet } from '@views/gostop/ui/DecideSheet';
import { GostopActions } from '@views/gostop/ui/GostopActions';
import { GostopAnnouncer } from '@views/gostop/ui/GostopAnnouncer';
import { GostopCutIn } from '@views/gostop/ui/GostopCutIn';
import { GostopDeal } from '@views/gostop/ui/GostopDeal';
import { GostopFloor } from '@views/gostop/ui/GostopFloor';
import { GostopHand } from '@views/gostop/ui/GostopHand';
import { GostopMine } from '@views/gostop/ui/GostopMine';
import { GostopRival } from '@views/gostop/ui/GostopRival';
import { GostopRoot } from '@views/gostop/ui/GostopRoot';
import { GostopRule } from '@views/gostop/ui/GostopRule';
import { GostopSettings } from '@views/gostop/ui/GostopSettings';
import { GostopStatus } from '@views/gostop/ui/GostopStatus';
import { GostopTable } from '@views/gostop/ui/GostopTable';
import { ResultSheet } from '@views/gostop/ui/ResultSheet';

export const Gostop = {
  Root: GostopRoot,
  Status: GostopStatus,
  Settings: GostopSettings,
  Table: GostopTable,
  Rival: GostopRival,
  Floor: GostopFloor,
  Mine: GostopMine,
  Hand: GostopHand,
  Deal: GostopDeal,
  CutIn: GostopCutIn,
  Actions: GostopActions,
  Rule: GostopRule,
  Announcer: GostopAnnouncer,
  DecideSheet,
  ResultSheet,
};
