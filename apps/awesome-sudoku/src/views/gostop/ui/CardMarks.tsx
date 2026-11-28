import { LuBird } from 'react-icons/lu';

import { MARK_BADGE, MARK_RIBBON, MARK_TEXT, MONTH_TAG } from '@views/gostop/config/cardStyle';
import { monthOf } from '@views/gostop/lib/cards';
import { cardMarkOf } from '@views/gostop/lib/view';

interface CardMarksProps {
  id: number;
}

export function CardMarks({ id }: CardMarksProps) {
  const mark = cardMarkOf(id);
  const badgeClass = MARK_BADGE[mark];
  const ribbonClass = MARK_RIBBON[mark];
  const isGodori = mark === 'godori';

  return (
    <span aria-hidden="true">
      <span className={MONTH_TAG}>{monthOf(id)}</span>
      {ribbonClass && <span className={ribbonClass}>{MARK_TEXT[mark]}</span>}
      {badgeClass && <span className={badgeClass}>{isGodori ? <LuBird /> : MARK_TEXT[mark]}</span>}
    </span>
  );
}
