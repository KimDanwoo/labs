import * as Card from '@ui/react/card';

import type { Project } from '@entities/project/model/types';

/** 카드마다 다른 시맨틱 톤 조합의 그라데이션 커버(리터럴이라 Tailwind 스캔 가능). */
const COVERS = [
  'bg-linear-to-br from-primary to-primary-accent',
  'bg-linear-to-br from-success to-primary',
  'bg-linear-to-br from-success to-info',
  'bg-linear-to-br from-warning to-error',
  'bg-linear-to-br from-secondary to-primary',
] as const;

/** 카드가 순차적으로 떠오르도록 인덱스마다 더하는 등장 지연(ms). */
const ENTRANCE_STAGGER_MS = 70;

type ProjectCardProps = {
  project: Project;
  index: number;
};

export function ProjectCard({ project, index }: ProjectCardProps) {
  const cover = COVERS[index % COVERS.length] ?? COVERS[0];

  return (
    <a
      href={project.href}
      target="_blank"
      rel="noreferrer"
      className="group block fade-up"
      style={{ animationDelay: `${index * ENTRANCE_STAGGER_MS}ms` }}
    >
      <Card.Root className="h-full overflow-hidden rounded-xl border-glass-border transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform group-hover:-translate-y-1.5 group-hover:border-primary group-hover:shadow-glow-lg">
        {/* 커버: 음수 마진으로 Card.Root의 p-lg를 상쇄해 가장자리까지 꽉 채운다. */}
        <div className={`relative -mx-lg -mt-lg flex h-32 items-center justify-center overflow-hidden ${cover}`}>
          {project.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.image}
              alt={project.title}
              className="size-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <span className="text-4xl font-bold text-white/95 transition-transform duration-500 ease-out select-none group-hover:scale-110">
              {project.title.charAt(0)}
            </span>
          )}
          {/* 상단 시트 + 호버 시 떠오르는 컬러 글로우 */}
          <span className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-linear-to-b from-white/20 to-transparent" />
          <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-primary/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        <Card.Header>
          <Card.Title className="transition-colors duration-200 group-hover:text-primary">{project.title}</Card.Title>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary transition-[background-color,transform] duration-200 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            >
              <path d="M7 17 17 7M7 7h10v10" />
            </svg>
          </span>
        </Card.Header>
        <Card.Description>{project.description}</Card.Description>
      </Card.Root>
    </a>
  );
}
