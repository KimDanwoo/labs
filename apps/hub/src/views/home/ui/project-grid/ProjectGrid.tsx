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
    <section aria-labelledby={PROJECTS_HEADING_ID} className={styles.section}>
      <div className={styles.header} style={revealDelay(REVEAL_DELAY_MS.projectsHeader)}>
        <h2 id={PROJECTS_HEADING_ID} className={styles.title}>
          Labs
        </h2>
        <p className={styles.count}>프로젝트 {PROJECTS.length}개</p>
      </div>

      <ul className={styles.list}>
        {PROJECTS.map((project, index) => {
          const layout = layouts[index];
          if (!layout) return null;

          return (
            <li
              key={project.href}
              className={cn(styles.desktopSpan[layout.rowSize], layout.isFullRowOnTablet && styles.tabletFullSpan)}
            >
              <ProjectCard project={project} index={index} coverSizes={layout.coverSizes} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
