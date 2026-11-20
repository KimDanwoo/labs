import { Controls } from '@entities/sudoku/ui/game-controls/Controls';
import { SelectNumber } from '@entities/sudoku/ui/sudoku-game/SelectNumber';

export function MobileControlPanel() {
  return (
    <div className="lg:hidden w-full mt-6 space-y-3 max-w-[360px]">
      <Controls />
      <SelectNumber />
    </div>
  );
}
