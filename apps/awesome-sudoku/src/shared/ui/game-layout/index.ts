import { GameLayoutActions } from '@shared/ui/game-layout/GameLayoutActions';
import { GameLayoutBoard } from '@shared/ui/game-layout/GameLayoutBoard';
import { GameLayoutDescription } from '@shared/ui/game-layout/GameLayoutDescription';
import { GameLayoutHeading } from '@shared/ui/game-layout/GameLayoutHeading';
import { GameLayoutPanel } from '@shared/ui/game-layout/GameLayoutPanel';
import { GameLayoutRoot } from '@shared/ui/game-layout/GameLayoutRoot';
import { GameLayoutStatus } from '@shared/ui/game-layout/GameLayoutStatus';
import { GameLayoutTitle } from '@shared/ui/game-layout/GameLayoutTitle';

export const GameLayout = {
  Root: GameLayoutRoot,
  Heading: GameLayoutHeading,
  Title: GameLayoutTitle,
  Description: GameLayoutDescription,
  Status: GameLayoutStatus,
  Board: GameLayoutBoard,
  Panel: GameLayoutPanel,
  Actions: GameLayoutActions,
};
