import { BottomSheet } from '@shared/ui/bottom-sheet';
import { Button } from '@shared/ui/button';
import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { SLITHERLINK_DIFFICULTY } from '@views/slitherlink/config/difficulty';
import { LEVEL_LABEL } from '@views/slitherlink/config/game';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';

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
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button variant="weak" size="l" onClick={confirm.dismiss}>
          {SLITHERLINK_COPY.confirmKeep}
        </Button>
        <Button size="l" onClick={confirm.accept}>
          {SLITHERLINK_COPY.newGame}
        </Button>
      </div>
    </BottomSheet>
  );
}
