import type { RowSize } from '../../lib/gridRows';

export const styles = {
  desktopSpan: { 1: 'lg:col-span-6', 2: 'lg:col-span-3', 3: 'lg:col-span-2' } satisfies Record<RowSize, string>,
} as const;
