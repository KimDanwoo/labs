import { GOSTOP_COPY, RESULT_COPY } from '@views/gostop/config/copy';
import { goBonusOf } from '@views/gostop/lib/goBonus';

interface GoLineProps {
  goCount: number;
}

export function GoLine({ goCount }: GoLineProps) {
  const bonus = goBonusOf(goCount);
  const hasTimes = bonus.times > 1;

  return (
    <span>
      {`${goCount}${RESULT_COPY.goTimes} · ${RESULT_COPY.plus}${bonus.add}${GOSTOP_COPY.points}`}
      {hasTimes && <b className="ml-1 font-black">{`${RESULT_COPY.times}${bonus.times}`}</b>}
    </span>
  );
}
