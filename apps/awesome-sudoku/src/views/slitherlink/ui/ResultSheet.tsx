import { formatTime } from '@shared/lib/formatTime';
import { useDismissible } from '@shared/lib/useDismissible';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { SuccessIcon } from '@shared/ui/SuccessIcon';
import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { LEVEL_LABEL } from '@views/slitherlink/config/game';
import { useElapsedContext } from '@views/slitherlink/model/hooks/useElapsedContext';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';
import { NextLevelButtons } from '@views/slitherlink/ui/NextLevelButtons';

export function ResultSheet() {
  const { isSolved, level, boardSize } = useSlitherlinkContext();
  const seconds = useElapsedContext();
  const { isOpen, dismiss } = useDismissible(isSolved);

  return (
    <BottomSheet isOpen={isOpen} onClose={dismiss} title={SLITHERLINK_COPY.resultTitle}>
      <div className="space-y-4 text-center">
        <SuccessIcon />
        <div>
          <p className="text-sm text-text-secondary">{SLITHERLINK_COPY.resultTime}</p>
          <p className="text-3xl font-bold text-text-primary font-tabular">{formatTime(seconds)}</p>
          <p className="mt-1 text-sm text-text-secondary">
            {LEVEL_LABEL[level]} · {boardSize}×{boardSize}
          </p>
        </div>
      </div>
      <div className="mt-6">
        <NextLevelButtons />
      </div>
    </BottomSheet>
  );
}
