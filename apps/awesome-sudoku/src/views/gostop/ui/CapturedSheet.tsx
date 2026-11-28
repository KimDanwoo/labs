import { BottomSheet } from '@shared/ui/bottom-sheet';
import { SHEET_COPY } from '@views/gostop/config/copy';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { CapturedSheetBody } from '@views/gostop/ui/CapturedSheetBody';

export function CapturedSheet() {
  const { isCapturedOpen, closeCaptured } = useGostopContext();

  return (
    <BottomSheet isOpen={isCapturedOpen} onClose={closeCaptured} title={SHEET_COPY.title}>
      <CapturedSheetBody />
    </BottomSheet>
  );
}
