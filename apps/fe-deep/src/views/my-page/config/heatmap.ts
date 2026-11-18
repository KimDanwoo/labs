export const MONTH_LABELS: readonly string[] = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
];

export const DAY_LABELS: readonly string[] = ['일', '', '화', '', '목', '', '토'];

export const DAYS_PER_WEEK = 7;

export const HEAT_LEVEL_COUNT = 4;

export const YEAR_START = { monthIndex: 0, day: 1 } as const;

export const YEAR_END = { monthIndex: 11, day: 31 } as const;

export const DATE_KEY_YEAR_LENGTH = 4;

export const DATE_PART_LENGTH = 2;

export const CELL_KIND = { outside: 'outside', future: 'future', day: 'day' } as const;
