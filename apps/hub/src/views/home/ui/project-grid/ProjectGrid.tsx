import { cn } from '@shared/lib/cn';

import { REVEAL_DELAY_MS } from '../../config/motion';
import { PROJECTS_HEADING_ID } from '../../config/page';
import { planProjectCardLayouts } from '../../lib/projectGridLayout';
import { revealDelay } from '../../lib/revealDelay';
import { PROJECTS } from '../../model/constants/projects';
import { ProjectCard } from './ProjectCard';
import { styles } from './ProjectGrid.styles';

export function ProjectGrid() {
  const layouts = planProjectCardLayouts(PROJECTS.length);

  return (
    <section aria-labelledby={PROJECTS_HEADING_ID} className="flex flex-col gap-xl">
      <div
        className="flex items-baseline justify-between gap-md border-b border-border pb-md fade-up"
        style={revealDelay(REVEAL_DELAY_MS.projectsHeader)}
      >
        <h2
          id={PROJECTS_HEADING_ID}
          className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          Labs
        </h2>
        <p className="text-sm text-muted-foreground">프로젝트 {PROJECTS.length}개</p>
      </div>

      <ul className="grid grid-cols-1 gap-x-lg gap-y-2xl sm:grid-cols-2 lg:grid-cols-6">
        {PROJECTS.map((project, index) => {
          const layout = layouts[index];
          if (!layout) return null;

          return (
            <li
              key={project.href}
              className={cn(styles.desktopSpan[layout.rowSize], layout.isFullRowOnTablet && 'sm:col-span-2')}
            >
              <ProjectCard project={project} index={index} coverSizes={layout.coverSizes} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
