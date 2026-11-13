import { Card } from '@ui/react';
import type { Project } from '../../model/types/project';

import { ArrowUpRightIcon } from './ArrowUpRightIcon';

const FALLBACK_BG = [
  'bg-primary-subtle',
  'bg-success-subtle',
  'bg-info-subtle',
  'bg-warning-subtle',
  'bg-secondary-subtle',
] as const;

const FALLBACK_FG = ['text-primary', 'text-success', 'text-info', 'text-warning', 'text-muted-foreground'] as const;

const IMAGE_POSITION = {
  top: 'object-top',
  center: 'object-center',
} as const;

const CARD_ENTER_DELAY_MS = 420;

const EAGER_IMAGE_COUNT = 3;

type ProjectCardProps = {
  project: Project;
  index: number;
  staggerBaseMs: number;
};

export function ProjectCard({ project, index, staggerBaseMs }: ProjectCardProps) {
  const fallbackBg = FALLBACK_BG[index % FALLBACK_BG.length] ?? FALLBACK_BG[0];
  const fallbackFg = FALLBACK_FG[index % FALLBACK_FG.length] ?? FALLBACK_FG[0];
  const imagePosition = IMAGE_POSITION[project.imagePosition ?? 'top'];
  const order = String(index + 1).padStart(2, '0');

  return (
    <a
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      data-spotlight
      className="group spotlight-host block rounded-xl fade-up scroll-reveal focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-hidden"
      style={{ animationDelay: `${CARD_ENTER_DELAY_MS + index * staggerBaseMs}ms` }}
    >
      <div className="spotlight-card h-full rounded-xl">
        <Card className="h-full gap-md overflow-hidden rounded-xl border-card-border bg-card transition-[border-color,box-shadow] duration-300 ease-out group-hover:border-primary/50 group-hover:shadow-glow group-focus-visible:border-primary/50 group-focus-visible:shadow-glow">
          <div className="relative -mx-lg -mt-lg aspect-video overflow-hidden">
            {project.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.image}
                alt=""
                loading={index < EAGER_IMAGE_COUNT ? 'eager' : 'lazy'}
                className={`size-full object-cover ${imagePosition} spotlight-cover`}
              />
            ) : (
              <div className={`absolute inset-0 flex items-center justify-center ${fallbackBg}`}>
                <span className={`font-display text-5xl font-bold tracking-tight select-none ${fallbackFg}`}>
                  {project.title.charAt(0)}
                </span>
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-card to-transparent" />

            <span className="absolute top-sm left-sm rounded-full border border-glass-border bg-glass px-sm py-xs font-mono text-xs text-foreground backdrop-blur-md">
              {order}
            </span>
          </div>

          <Card.Header className="items-center">
            <Card.Title className="font-display text-base font-semibold tracking-tight transition-colors duration-200 group-hover:text-primary group-focus-visible:text-primary sm:text-lg">
              {project.title}
            </Card.Title>
            <Card.Action className="row-span-1 self-center">
              <span className="flex size-7 items-center justify-center rounded-full border border-card-border text-muted-foreground transition-colors duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowUpRightIcon />
              </span>
            </Card.Action>
          </Card.Header>

          {project.description && (
            <Card.Description className="-mt-xs text-sm leading-relaxed">{project.description}</Card.Description>
          )}
        </Card>
      </div>
    </a>
  );
}
