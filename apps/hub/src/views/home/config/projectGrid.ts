import type { RowSize } from '../lib/gridRows';
import type { Project } from '../model/types/project';

export const COVER_WIDTH = {
  desktop: { 1: '61rem', 2: '30rem', 3: '20rem' } satisfies Record<RowSize, string>,
  tabletFull: 'calc(100vw - 3rem)',
  tabletHalf: 'calc(50vw - 2.25rem)',
  mobile: 'calc(100vw - 3rem)',
} as const;

export const MEDIA_MIN_WIDTH = { desktop: '64rem', tablet: '40rem' } as const;

export const DEFAULT_IMAGE_POSITION: NonNullable<Project['imagePosition']> = 'top';
