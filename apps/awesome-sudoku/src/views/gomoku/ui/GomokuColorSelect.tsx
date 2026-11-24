import { IconButton } from '@shared/ui/icon-button';
import { GOMOKU_COPY, STONE_OPTIONS } from '@views/gomoku/config/copy';
import { useGomokuContext } from '@views/gomoku/model/hooks/useGomokuContext';

export function GomokuColorSelect() {
  const { playerStone, selectStone } = useGomokuContext();

  return (
    <div className="flex flex-col items-center gap-2">
      <div role="group" aria-label={GOMOKU_COPY.colorSelect} className="flex gap-3">
        {STONE_OPTIONS.map(({ stone, label }) => (
          <IconButton.Root
            key={stone}
            type="button"
            aria-pressed={playerStone === stone}
            variant={playerStone === stone ? 'primary' : 'default'}
            className="aspect-auto min-h-11 w-auto px-4 lg:max-w-none xl:max-w-none"
            onClick={() => selectStone(stone)}
          >
            <IconButton.Label>{label}</IconButton.Label>
          </IconButton.Root>
        ))}
      </div>
      <p className="text-xs text-text-secondary">{GOMOKU_COPY.colorHint}</p>
    </div>
  );
}
