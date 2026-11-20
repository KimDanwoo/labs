import { Controls } from '@entities/sudoku/ui/game-controls/Controls';
import { SelectNumber } from '@entities/sudoku/ui/sudoku-game/SelectNumber';

export function DesktopControlPanel() {
  return (
    <div className="hidden lg:flex flex-col pt-[52px]">
      <div className="bg-glass/60 dark:bg-glass/70 backdrop-blur-sm rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] ring-1 ring-surface-primary/80 dark:ring-white/5 w-[432px] xl:w-[504px] h-[432px] xl:h-[504px] p-5 flex flex-col gap-4">
        <Controls />
        <div className="flex-1">
          <SelectNumber />
        </div>
      </div>
    </div>
  );
}
