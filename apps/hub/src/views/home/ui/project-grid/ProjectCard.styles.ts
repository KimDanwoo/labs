import type { Project } from '../../model/types/project';

export const styles = {
  imagePosition: { top: 'object-top', center: 'object-center' } satisfies Record<
    NonNullable<Project['imagePosition']>,
    string
  >,
} as const;
