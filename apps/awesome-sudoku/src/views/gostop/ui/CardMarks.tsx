import { LuBird } from 'react-icons/lu';

import { MARK_BADGE, MARK_RIBBON, MARK_TEXT, MONTH_TAG } from '@views/gostop/config/cardStyle';
import { monthOf } from '@views/gostop/lib/cards';
import { cardMarkOf } from '@views/gostop/lib/view';

interface CardMarksProps {
  id: number;
  isMini: boolean;
}

export function CardMarks({ id, isMini }: CardMarksProps) {
  const mark = cardMarkOf(id);
  const badgeClass = MARK_BADGE[mark];
  const ribbonClass = MARK_RIBBON[mark];
  const isGodori = mark === 'godori';
  const text = isMini ? null : MARK_TEXT[mark];

  return (
    <span aria-hidden="true">
      {!isMini && <span className={MONTH_TAG}>{monthOf(id)}</span>}
      {ribbonClass && <span className={ribbonClass}>{text}</span>}
      {badgeClass && <span className={badgeClass}>{isGodori ? <LuBird /> : text}</span>}
    </span>
  );
}
