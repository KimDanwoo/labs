import { GameHeading } from '@entities/game-catalog';
import { GAME_MODE, SudokuScreen } from '@entities/sudoku';

export function KillerSudokuPage() {
  return (
    <SudokuScreen mode={GAME_MODE.KILLER}>
      <GameHeading game="killer" />
    </SudokuScreen>
  );
}
