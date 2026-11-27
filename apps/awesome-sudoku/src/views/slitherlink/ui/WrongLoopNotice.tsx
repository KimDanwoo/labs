import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';
import { LuCircleDashed } from 'react-icons/lu';

export function WrongLoopNotice() {
  const { isWrongLoop } = useSlitherlinkContext();

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center"
    >
      {isWrongLoop && (
        <p className="inline-flex animate-snackbar-in items-center gap-2 rounded-full bg-lemon px-4 py-2 text-sm font-bold text-ink break-keep">
          <LuCircleDashed aria-hidden="true" className="shrink-0" />
          {SLITHERLINK_COPY.wrongLoop}
        </p>
      )}
    </div>
  );
}
