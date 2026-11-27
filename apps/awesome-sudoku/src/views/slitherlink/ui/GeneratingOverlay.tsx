import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';
import { LoopLoader } from '@views/slitherlink/ui/LoopLoader';

export function GeneratingOverlay() {
  const { isGenerating } = useSlitherlinkContext();

  if (!isGenerating) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-[20px] bg-face/95"
    >
      <LoopLoader />
      <span className="text-sm font-normal text-text-secondary">{SLITHERLINK_COPY.generating}</span>
    </div>
  );
}
