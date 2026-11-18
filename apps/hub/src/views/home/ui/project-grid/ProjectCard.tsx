import { cn } from '@shared/lib/cn';
import Image from 'next/image';

import { CARD_STAGGER_MS, REVEAL_DELAY_MS } from '../../config/motion';
import { SCOPE_SEPARATOR } from '../../config/page';
import { DEFAULT_IMAGE_POSITION } from '../../config/projectGrid';
import { revealDelay } from '../../lib/revealDelay';
import type { Project } from '../../model/types/project';
import { ArrowUpRightIcon } from './ArrowUpRightIcon';
import { styles } from './ProjectCard.styles';

interface ProjectCardProps {
  project: Project;
  index: number;
  coverSizes: string;
}

export function ProjectCard({ project, index, coverSizes }: ProjectCardProps) {
  const host = new URL(project.href).host;

  return (
    <a
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
      style={revealDelay(REVEAL_DELAY_MS.firstCard + index * CARD_STAGGER_MS)}
    >
      <div className={styles.media}>
        {project.image ? (
          <Image
            src={project.image}
            alt=""
            fill
            sizes={coverSizes}
            className={cn(styles.image, styles.imagePosition[project.imagePosition ?? DEFAULT_IMAGE_POSITION])}
          />
        ) : (
          <span aria-hidden="true" className={styles.fallback}>
            {project.title.charAt(0)}
          </span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{project.title}</h3>
          <p className={styles.host}>
            {host}
            <ArrowUpRightIcon />
            <span className="sr-only">(새 탭에서 열림)</span>
          </p>
        </div>
        {project.description && <p className={styles.description}>{project.description}</p>}
        {project.scope && (
          <p className={styles.scope}>
            <span className="sr-only">다룬 영역: </span>
            {project.scope.join(SCOPE_SEPARATOR)}
          </p>
        )}
      </div>
    </a>
  );
}
