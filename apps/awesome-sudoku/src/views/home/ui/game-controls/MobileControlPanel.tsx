import { Controls } from '@views/home/ui/game-controls/Controls';
import { SelectNumber } from '@views/home/ui/sudoku-game/SelectNumber';

export function MobileControlPanel() {
  return (
    <div className="lg:hidden w-full mt-6 space-y-3 max-w-[360px]">
      <Controls />
      <SelectNumber />
    </div>
  );
}
