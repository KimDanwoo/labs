import { cn } from '@shared/lib/cn';
import Image from 'next/image';

import { CARD_STAGGER_MS, REVEAL_DELAY_MS } from '@views/home/config/motion';
import { SCOPE_SEPARATOR } from '@views/home/config/page';
import { DEFAULT_IMAGE_POSITION } from '@views/home/config/projectGrid';
import { revealDelay } from '@views/home/lib/revealDelay';
import type { Project } from '@views/home/model/types/project';
import { ArrowUpRightIcon } from '@views/home/ui/project-grid/ArrowUpRightIcon';

interface ProjectCardProps {
  project: Project;
  index: number;
  coverSizes: string;
}

export function ProjectCard({ project, index, coverSizes }: ProjectCardProps) {
  const host = new URL(project.href).host;
  const imagePositionClass = { top: 'object-top', center: 'object-center' }[
    project.imagePosition ?? DEFAULT_IMAGE_POSITION
  ];

  return (
    <a
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col gap-md rounded-xl fade-up"
      style={revealDelay(REVEAL_DELAY_MS.firstCard + index * CARD_STAGGER_MS)}
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-border group-hover:ring-primary/60 group-hover:transition-shadow group-hover:duration-200 group-active:ring-primary">
        {project.image ? (
          <Image
            src={project.image}
            alt=""
            fill
            sizes={coverSizes}
            className={cn(
              'object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]',
              imagePositionClass,
            )}
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center font-display text-5xl font-bold tracking-tight text-muted-foreground select-none"
          >
            {project.title.charAt(0)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-xs px-xs">
        <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-xs">
          <h3 className="font-display text-lg font-bold tracking-tight text-foreground group-hover:text-primary group-hover:transition-colors group-hover:duration-200 sm:text-xl">
            {project.title}
          </h3>
          <p className="inline-flex items-center gap-xs text-sm text-muted-foreground group-hover:text-primary group-hover:transition-colors group-hover:duration-200">
            {host}
            <ArrowUpRightIcon />
            <span className="sr-only">(새 탭에서 열림)</span>
          </p>
        </div>
        {project.description && <p className="leading-relaxed text-muted-foreground">{project.description}</p>}
        {project.scope && (
          <p className="text-sm text-muted-foreground">
            <span className="sr-only">다룬 영역: </span>
            {project.scope.join(SCOPE_SEPARATOR)}
          </p>
        )}
      </div>
    </a>
  );
}
