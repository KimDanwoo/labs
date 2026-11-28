import { ADDITIVE_GO_LIMIT } from '@views/gostop/config/score';

export interface GoBonus {
  add: number;
  times: number;
}

export const goBonusOf = (goCount: number): GoBonus => ({
  add: Math.min(goCount, ADDITIVE_GO_LIMIT),
  times: 2 ** Math.max(goCount - ADDITIVE_GO_LIMIT, 0),
});
