import { planCardRowSizes, type RowSize } from '../../lib/gridRows';
import { PROJECTS } from '../../model/constants/projects';
import { ProjectCard } from './ProjectCard';

const HEADING_ID = 'projects-heading';
const GRID_STAGGER_BASE_MS = 60;

const DESKTOP_SPAN = {
  1: 'lg:col-span-6',
  2: 'lg:col-span-3',
  3: 'lg:col-span-2',
} satisfies Record<RowSize, string>;

const DESKTOP_COVER_WIDTH = {
  1: '61rem',
  2: '30rem',
  3: '20rem',
} satisfies Record<RowSize, string>;

const TABLET_FULL_SPAN = 'sm:col-span-2';
const TABLET_COVER_WIDTH = { full: 'calc(100vw - 3rem)', half: 'calc(50vw - 2.25rem)' } as const;
const MOBILE_COVER_WIDTH = 'calc(100vw - 3rem)';

const CARD_ROW_SIZES = planCardRowSizes(PROJECTS.length);
const HAS_ODD_COUNT = PROJECTS.length % 2 === 1;

export function ProjectGrid() {
  return (
    <section aria-labelledby={HEADING_ID} className="flex flex-col gap-xl">
      <div
        className="flex items-baseline justify-between gap-md border-b border-border pb-md fade-up"
        style={{ animationDelay: '360ms' }}
      >
        <h2 id={HEADING_ID} className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Labs
        </h2>
        <p className="text-sm text-muted-foreground">프로젝트 {PROJECTS.length}개</p>
      </div>

      <ul className="grid grid-cols-1 gap-x-lg gap-y-2xl sm:grid-cols-2 lg:grid-cols-6">
        {PROJECTS.map((project, index) => {
          const rowSize = CARD_ROW_SIZES[index] ?? 1;
          const isFullRowOnTablet = HAS_ODD_COUNT && index === 0;
          const tabletCoverWidth = isFullRowOnTablet ? TABLET_COVER_WIDTH.full : TABLET_COVER_WIDTH.half;

          return (
            <li key={project.href} className={`${DESKTOP_SPAN[rowSize]} ${isFullRowOnTablet ? TABLET_FULL_SPAN : ''}`}>
              <ProjectCard
                project={project}
                index={index}
                staggerBaseMs={GRID_STAGGER_BASE_MS}
                coverSizes={`(min-width: 64rem) ${DESKTOP_COVER_WIDTH[rowSize]}, (min-width: 40rem) ${tabletCoverWidth}, ${MOBILE_COVER_WIDTH}`}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
