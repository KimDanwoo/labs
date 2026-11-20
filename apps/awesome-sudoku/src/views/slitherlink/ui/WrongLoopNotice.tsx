import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';
import { LuCircleDashed } from 'react-icons/lu';

export function WrongLoopNotice() {
  const { isWrongLoop } = useSlitherlinkContext();

  return (
    <div role="status" aria-live="polite" className="my-4 flex min-h-10 w-full max-w-[400px] justify-center">
      {isWrongLoop && (
        <p className="inline-flex animate-snackbar-in items-center gap-2 rounded-full bg-surface-primary/90 px-4 py-2 text-sm text-text-primary shadow-sm ring-1 ring-border-light break-keep">
          <LuCircleDashed aria-hidden="true" className="shrink-0 text-accent-text" />
          {SLITHERLINK_COPY.wrongLoop}
        </p>
      )}
    </div>
  );
}
