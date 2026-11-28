import type { CardSpec, HwatuCard } from '@views/gostop/model/types/gostop';

export const CARD_KIND = {
  GWANG: 'gwang',
  YEOL: 'yeol',
  TTI: 'tti',
  PI: 'pi',
} as const;

export const RIBBON = {
  HONG: 'hong',
  CHEONG: 'cheong',
  CHO: 'cho',
  PLAIN: 'plain',
} as const;

export const MONTH_COUNT = 12;
export const CARDS_PER_MONTH = 4;

const GWANG: CardSpec = { kind: CARD_KIND.GWANG };
const RAIN_GWANG: CardSpec = { kind: CARD_KIND.GWANG, isRainGwang: true };
const YEOL: CardSpec = { kind: CARD_KIND.YEOL };
const GODORI: CardSpec = { kind: CARD_KIND.YEOL, isGodori: true };
const PI: CardSpec = { kind: CARD_KIND.PI, piValue: 1 };
const SSANG_PI: CardSpec = { kind: CARD_KIND.PI, piValue: 2 };
const HONG_DAN: CardSpec = { kind: CARD_KIND.TTI, ribbon: RIBBON.HONG };
const CHEONG_DAN: CardSpec = { kind: CARD_KIND.TTI, ribbon: RIBBON.CHEONG };
const CHO_DAN: CardSpec = { kind: CARD_KIND.TTI, ribbon: RIBBON.CHO };
const PLAIN_TTI: CardSpec = { kind: CARD_KIND.TTI, ribbon: RIBBON.PLAIN };

const MONTH_SPECS: readonly (readonly CardSpec[])[] = [
  [GWANG, HONG_DAN, PI, PI],
  [GODORI, HONG_DAN, PI, PI],
  [GWANG, HONG_DAN, PI, PI],
  [GODORI, CHO_DAN, PI, PI],
  [YEOL, CHO_DAN, PI, PI],
  [YEOL, CHEONG_DAN, PI, PI],
  [YEOL, CHO_DAN, PI, PI],
  [GWANG, GODORI, PI, PI],
  [YEOL, CHEONG_DAN, PI, PI],
  [YEOL, CHEONG_DAN, PI, PI],
  [GWANG, SSANG_PI, PI, PI],
  [RAIN_GWANG, YEOL, PLAIN_TTI, SSANG_PI],
];

export const CARDS: readonly HwatuCard[] = MONTH_SPECS.flatMap((specs, monthIndex) =>
  specs.map((spec, slot) => ({
    id: monthIndex * CARDS_PER_MONTH + slot,
    month: monthIndex + 1,
    kind: spec.kind,
    ribbon: spec.ribbon ?? null,
    piValue: spec.piValue ?? 0,
    isGodori: spec.isGodori ?? false,
    isRainGwang: spec.isRainGwang ?? false,
  })),
);

export const DECK_SIZE = CARDS.length;
