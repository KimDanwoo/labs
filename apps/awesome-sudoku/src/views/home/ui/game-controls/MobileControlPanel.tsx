import { SelectNumber } from '../sudoku-game/SelectNumber';
import { Controls } from './Controls';

export function MobileControlPanel() {
  return (
    <div className="lg:hidden w-full mt-6 space-y-3 max-w-[360px]">
      <Controls />
      <SelectNumber />
    </div>
  );
}
