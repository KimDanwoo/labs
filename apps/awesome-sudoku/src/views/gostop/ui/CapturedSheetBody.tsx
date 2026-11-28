import { Button } from '@shared/ui/button';
import { SHEET_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { useFocusOnMount } from '@views/gostop/model/hooks/useFocusOnMount';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { CapturedSheetSide } from '@views/gostop/ui/CapturedSheetSide';

export function CapturedSheetBody() {
  const { closeCaptured } = useGostopContext();
  const bodyRef = useFocusOnMount<HTMLDivElement>();

  return (
    <div ref={bodyRef} tabIndex={-1} className="grid gap-4 outline-none">
      <CapturedSheetSide side={SIDE.ME} />
      <CapturedSheetSide side={SIDE.COMPUTER} />
      <Button variant="weak" size="l" isFull onClick={closeCaptured}>
        {SHEET_COPY.close}
      </Button>
    </div>
  );
}
