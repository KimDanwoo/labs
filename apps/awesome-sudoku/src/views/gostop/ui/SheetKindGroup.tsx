import { KIND_LABEL, SHEET_COPY } from '@views/gostop/config/copy';
import { kindCount } from '@views/gostop/lib/view';
import type { CardKind } from '@views/gostop/model/types/gostop';
import { HwatuCard } from '@views/gostop/ui/HwatuCard';

interface SheetKindGroupProps {
  kind: CardKind;
  ids: readonly number[];
}

export function SheetKindGroup({ kind, ids }: SheetKindGroupProps) {
  const isEmpty = ids.length === 0;

  return (
    <div className="grid grid-cols-[52px_minmax(0,1fr)] items-start gap-2">
      <p className="pt-1 text-[13px] font-semibold text-text-secondary">
        {KIND_LABEL[kind]}
        <b className="ml-1 font-black text-text-primary tabular-nums">{kindCount(kind, ids)}</b>
      </p>
      {isEmpty ? (
        <p className="pt-1 text-[13px] text-text-tertiary">{SHEET_COPY.empty}</p>
      ) : (
        <ul className="flex flex-wrap gap-1">
          {ids.map((id) => (
            <li key={id} className="w-10">
              <HwatuCard id={id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
