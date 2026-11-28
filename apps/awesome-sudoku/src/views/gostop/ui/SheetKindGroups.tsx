import { CAPTURE_KINDS } from '@views/gostop/config/cardStyle';
import { capturedByKind } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import type { Side } from '@views/gostop/model/types/gostop';
import { SheetKindGroup } from '@views/gostop/ui/SheetKindGroup';

interface SheetKindGroupsProps {
  side: Side;
}

export function SheetKindGroups({ side }: SheetKindGroupsProps) {
  const { captured } = useGostopContext();
  const groups = capturedByKind(captured[side]);

  return (
    <div className="grid gap-2">
      {CAPTURE_KINDS.map((kind) => (
        <SheetKindGroup key={kind} kind={kind} ids={groups[kind]} />
      ))}
    </div>
  );
}
