import { BottomSheet } from '@shared/ui/bottom-sheet';
import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { SLITHERLINK_DIFFICULTY } from '@views/slitherlink/config/difficulty';
import { LEVEL_LABEL } from '@views/slitherlink/config/game';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';
import { SheetButton } from '@views/slitherlink/ui/SheetButton';

export function ConfirmSheet() {
  const { confirm } = useSlitherlinkContext();
  const { size } = SLITHERLINK_DIFFICULTY[confirm.level];

  return (
    <BottomSheet isOpen={confirm.isOpen} onClose={confirm.dismiss} title={SLITHERLINK_COPY.confirmTitle}>
      <div className="space-y-2 text-center">
        <p className="text-lg font-semibold text-text-primary">
          {LEVEL_LABEL[confirm.level]} · {size}×{size}
        </p>
        <p className="text-sm text-text-secondary break-keep">{SLITHERLINK_COPY.confirmMessage}</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <SheetButton variant="secondary" onClick={confirm.dismiss}>
          {SLITHERLINK_COPY.confirmKeep}
        </SheetButton>
        <SheetButton variant="primary" onClick={confirm.accept}>
          {SLITHERLINK_COPY.newGame}
        </SheetButton>
      </div>
    </BottomSheet>
  );
}
