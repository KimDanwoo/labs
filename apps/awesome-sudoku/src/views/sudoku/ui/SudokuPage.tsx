import { GameHeading } from '@entities/game-catalog';
import { GAME_MODE, SudokuScreen } from '@entities/sudoku';

export function SudokuPage() {
  return (
    <SudokuScreen mode={GAME_MODE.CLASSIC}>
      <GameHeading game="sudoku" />
    </SudokuScreen>
  );
}
