import { CARD_KIND } from '@views/gostop/config/cards';
import { PI_BAK_MAX_PI } from '@views/gostop/config/score';
import { cardOf } from '@views/gostop/lib/cards';
import { countPi, scoreOf } from '@views/gostop/lib/score';
import type { BakRisk } from '@views/gostop/model/types/view';

const gwangCount = (captured: readonly number[]): number =>
  captured.filter((id) => cardOf(id).kind === CARD_KIND.GWANG).length;

export function bakRisks(mine: readonly number[], rival: readonly number[]): BakRisk[] {
  const rivalScore = scoreOf(rival);
  const isPiBakRisk = rivalScore.pi > 0 && countPi(mine) <= PI_BAK_MAX_PI;
  const isGwangBakRisk = rivalScore.gwang > 0 && gwangCount(mine) === 0;
  const risks: [BakRisk, boolean][] = [
    ['piBak', isPiBakRisk],
    ['gwangBak', isGwangBakRisk],
  ];
  return risks.filter(([, isRisk]) => isRisk).map(([risk]) => risk);
}
