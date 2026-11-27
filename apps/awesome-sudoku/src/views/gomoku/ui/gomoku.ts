import { GomokuActions } from '@views/gomoku/ui/GomokuActions';
import { GomokuBoard } from '@views/gomoku/ui/GomokuBoard';
import { GomokuColorSelect } from '@views/gomoku/ui/GomokuColorSelect';
import { GomokuRoot } from '@views/gomoku/ui/GomokuRoot';
import { GomokuRule } from '@views/gomoku/ui/GomokuRule';
import { GomokuStatus } from '@views/gomoku/ui/GomokuStatus';
import { ResultSheet } from '@views/gomoku/ui/ResultSheet';

export const Gomoku = {
  Root: GomokuRoot,
  Status: GomokuStatus,
  Board: GomokuBoard,
  ColorSelect: GomokuColorSelect,
  Actions: GomokuActions,
  Rule: GomokuRule,
  ResultSheet,
};
