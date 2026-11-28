import { BottomSheet } from '@shared/ui/bottom-sheet';
import { Button } from '@shared/ui/button';
import { SHEET_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { CapturedSheetSide } from '@views/gostop/ui/CapturedSheetSide';

export function CapturedSheet() {
  const { isCapturedOpen, closeCaptured } = useGostopContext();

  return (
    <BottomSheet isOpen={isCapturedOpen} onClose={closeCaptured} title={SHEET_COPY.title}>
      <div className="grid gap-4">
        <CapturedSheetSide side={SIDE.ME} />
        <CapturedSheetSide side={SIDE.COMPUTER} />
        <Button variant="weak" size="l" isFull autoFocus onClick={closeCaptured}>
          {SHEET_COPY.close}
        </Button>
      </div>
    </BottomSheet>
  );
}
