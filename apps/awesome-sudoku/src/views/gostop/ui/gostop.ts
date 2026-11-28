import { DecideSheet } from '@views/gostop/ui/DecideSheet';
import { GostopActions } from '@views/gostop/ui/GostopActions';
import { GostopCaptured } from '@views/gostop/ui/GostopCaptured';
import { GostopFloor } from '@views/gostop/ui/GostopFloor';
import { GostopHand } from '@views/gostop/ui/GostopHand';
import { GostopRival } from '@views/gostop/ui/GostopRival';
import { GostopRoot } from '@views/gostop/ui/GostopRoot';
import { GostopRule } from '@views/gostop/ui/GostopRule';
import { GostopStatus } from '@views/gostop/ui/GostopStatus';
import { GostopTable } from '@views/gostop/ui/GostopTable';
import { GostopTurnBar } from '@views/gostop/ui/GostopTurnBar';
import { ResultSheet } from '@views/gostop/ui/ResultSheet';

export const Gostop = {
  Root: GostopRoot,
  Status: GostopStatus,
  Table: GostopTable,
  Rival: GostopRival,
  TurnBar: GostopTurnBar,
  Floor: GostopFloor,
  Captured: GostopCaptured,
  Hand: GostopHand,
  Actions: GostopActions,
  Rule: GostopRule,
  DecideSheet,
  ResultSheet,
};
