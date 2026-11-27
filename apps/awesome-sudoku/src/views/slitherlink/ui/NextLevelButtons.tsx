import { Button } from '@shared/ui/button';
import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { LEVEL_LABEL, LEVEL_OPTIONS } from '@views/slitherlink/config/game';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';

export function NextLevelButtons() {
  const { level, startGame } = useSlitherlinkContext();

  return (
    <section className="grid gap-2.5">
      <h3 className="text-[13px] font-semibold text-text-tertiary">{SLITHERLINK_COPY.resultNext}</h3>
      <div className="grid grid-cols-3 gap-2">
        {LEVEL_OPTIONS.map((option) => (
          <Button key={option} size="l" variant={option === level ? 'fill' : 'weak'} onClick={() => startGame(option)}>
            {LEVEL_LABEL[option]}
          </Button>
        ))}
      </div>
    </section>
  );
}
