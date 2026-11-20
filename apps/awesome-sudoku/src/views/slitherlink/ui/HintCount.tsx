import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';
import { LuLightbulb } from 'react-icons/lu';

export function HintCount() {
  const { hintsRemaining } = useSlitherlinkContext();

  return (
    <div className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-text-secondary font-tabular">
      <LuLightbulb aria-hidden="true" className="text-hint-text" />
      <span className="sr-only">{SLITHERLINK_COPY.hintsLabel}</span>
      <span>{hintsRemaining}</span>
    </div>
  );
}
