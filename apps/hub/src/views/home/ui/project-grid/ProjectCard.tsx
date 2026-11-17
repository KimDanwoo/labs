import Image from 'next/image';

import type { Project } from '../../model/types/project';

import { ArrowUpRightIcon } from './ArrowUpRightIcon';

const IMAGE_POSITION = {
  top: 'object-top',
  center: 'object-center',
} as const;

const CARD_ENTER_DELAY_MS = 420;

const SCOPE_SEPARATOR = ' · ';

type ProjectCardProps = {
  project: Project;
  index: number;
  staggerBaseMs: number;
  coverSizes: string;
};

export function ProjectCard({ project, index, staggerBaseMs, coverSizes }: ProjectCardProps) {
  const imagePosition = IMAGE_POSITION[project.imagePosition ?? 'top'];
  const host = new URL(project.href).host;

  return (
    <a
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col gap-md rounded-xl fade-up"
      style={{ animationDelay: `${CARD_ENTER_DELAY_MS + index * staggerBaseMs}ms` }}
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-border group-hover:ring-primary/60 group-hover:transition-shadow group-hover:duration-200 group-active:ring-primary">
        {project.image ? (
          <Image
            src={project.image}
            alt=""
            fill
            sizes={coverSizes}
            className={`object-cover ${imagePosition} transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]`}
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
