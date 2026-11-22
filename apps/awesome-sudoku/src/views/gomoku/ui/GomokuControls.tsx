import { IconButton } from '@shared/ui/icon-button';
import { GOMOKU_COPY } from '@views/gomoku/config/copy';
import { useGomokuContext } from '@views/gomoku/model/hooks/useGomokuContext';
import { LuPlus, LuUndo2 } from 'react-icons/lu';

export function GomokuControls() {
  const { canUndo, undo, reset } = useGomokuContext();

  return (
    <div className="flex w-full max-w-[560px] flex-col items-center gap-4">
      <div className="flex gap-3">
        <IconButton.Root type="button" className="w-18" onClick={undo} disabled={!canUndo}>
          <IconButton.Icon>
            <LuUndo2 strokeWidth={2} />
          </IconButton.Icon>
          <IconButton.Label>{GOMOKU_COPY.undo}</IconButton.Label>
        </IconButton.Root>
        <IconButton.Root type="button" variant="primary" className="w-18" onClick={reset}>
          <IconButton.Icon>
            <LuPlus strokeWidth={2} />
          </IconButton.Icon>
          <IconButton.Label>{GOMOKU_COPY.newGame}</IconButton.Label>
        </IconButton.Root>
      </div>
      <p className="text-center text-sm leading-relaxed text-text-secondary break-keep">{GOMOKU_COPY.rule}</p>
    </div>
  );
}
