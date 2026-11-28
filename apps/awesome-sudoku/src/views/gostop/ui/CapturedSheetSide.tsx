import { GOSTOP_COPY, SHEET_COPY } from '@views/gostop/config/copy';
import { SIDE } from '@views/gostop/config/game';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import type { Side } from '@views/gostop/model/types/gostop';
import { JokboChips } from '@views/gostop/ui/JokboChips';
import { SheetKindGroups } from '@views/gostop/ui/SheetKindGroups';

interface CapturedSheetSideProps {
  side: Side;
}

export function CapturedSheetSide({ side }: CapturedSheetSideProps) {
  const { scores } = useGostopContext();
  const name = side === SIDE.ME ? SHEET_COPY.mine : SHEET_COPY.rival;

  return (
    <section aria-label={name} className="grid gap-2.5 rounded-2xl bg-weak p-3.5">
      <h3 className="flex items-baseline justify-between text-[16px] font-extrabold text-text-primary">
        {name}
        <span className="text-[20px] font-black tabular-nums">{`${scores[side].total}${GOSTOP_COPY.points}`}</span>
      </h3>
      <JokboChips side={side} />
      <SheetKindGroups side={side} />
    </section>
  );
}
