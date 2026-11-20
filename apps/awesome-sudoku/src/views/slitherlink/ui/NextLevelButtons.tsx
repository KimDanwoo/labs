import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { LEVEL_LABEL, LEVEL_OPTIONS } from '@views/slitherlink/config/game';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';
import { SheetButton } from '@views/slitherlink/ui/SheetButton';

export function NextLevelButtons() {
  const { level, startGame } = useSlitherlinkContext();

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wider text-text-secondary">{SLITHERLINK_COPY.resultNext}</h3>
      <div className="grid grid-cols-3 gap-2">
        {LEVEL_OPTIONS.map((option) => (
          <SheetButton
            key={option}
            variant={option === level ? 'primary' : 'secondary'}
            onClick={() => startGame(option)}
          >
            {LEVEL_LABEL[option]}
          </SheetButton>
        ))}
      </div>
    </section>
  );
}
