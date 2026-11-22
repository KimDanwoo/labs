import { IconButton } from '@shared/ui/icon-button';
import { WALLS_COPY, WALLS_RULES } from '@views/walls/config/copy';
import { useWallsContext } from '@views/walls/model/hooks/useWallsContext';
import { LuPlus, LuUndo2 } from 'react-icons/lu';

export function WallsControls() {
  const { canUndo, undo, reset } = useWallsContext();

  return (
    <div className="flex w-full max-w-[480px] flex-col items-center gap-4">
      <div className="flex gap-3">
        <IconButton.Root type="button" className="w-18" onClick={undo} disabled={!canUndo}>
          <IconButton.Icon>
            <LuUndo2 strokeWidth={2} />
          </IconButton.Icon>
          <IconButton.Label>{WALLS_COPY.undo}</IconButton.Label>
        </IconButton.Root>
        <IconButton.Root type="button" variant="primary" className="w-18" onClick={reset}>
          <IconButton.Icon>
            <LuPlus strokeWidth={2} />
          </IconButton.Icon>
          <IconButton.Label>{WALLS_COPY.newGame}</IconButton.Label>
        </IconButton.Root>
      </div>
      <section className="w-full space-y-2">
        <h2 className="text-xs font-semibold tracking-wider text-text-secondary">{WALLS_COPY.rulesTitle}</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-text-secondary break-keep">
          {WALLS_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
