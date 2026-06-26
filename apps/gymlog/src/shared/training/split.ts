export const SPLIT = {
  fullBody: '무분할',
  upperLower: '상하체 분할',
  ppl: '푸시·풀·레그',
  broSplit: '부위 분할',
  custom: '직접 만들기',
} as const;

export type Split = keyof typeof SPLIT;

// 사용자가 온보딩/설정에서 고를 수 있는 분할(직접 만들기 포함).
export const SELECTABLE_SPLITS: readonly Split[] = ['fullBody', 'upperLower', 'ppl', 'broSplit', 'custom'];
