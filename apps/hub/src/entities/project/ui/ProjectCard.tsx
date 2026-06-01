import * as Card from '@ui/react/card';

import type { Project } from '@entities/project/model/types';

/** 카드마다 다른 시맨틱 톤 조합의 그라데이션 커버(리터럴이라 Tailwind 스캔 가능). */
const COVERS = [
  'bg-linear-to-br from-primary to-primary-accent',
  'bg-linear-to-br from-info to-primary',
  'bg-linear-to-br from-success to-info',
  'bg-linear-to-br from-warning to-error',
  'bg-linear-to-br from-secondary to-primary',
] as const;

type ProjectCardProps = {
  project: Project;
  index: number;
};

export function ProjectCard({ project, index }: ProjectCardProps) {
  const cover = COVERS[index % COVERS.length] ?? COVERS[0];

  return (
    <a href={project.href} target="_blank" rel="noreferrer" className="group block">
      <Card.Root className="h-full overflow-hidden group-hover:border-primary group-hover:shadow-glow">
        {/* 커버: 음수 마진으로 Card.Root의 p-lg를 상쇄해 가장자리까지 꽉 채운다. */}
        <div className={`-mx-lg -mt-lg flex h-32 items-center justify-center ${cover}`}>
          {project.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.image} alt={project.title} className="size-full object-cover object-top" />
          ) : (
            <span className="text-4xl font-bold text-white/95 select-none">{project.title.charAt(0)}</span>
          )}
        </div>
        <Card.Header>
          <Card.Title>{project.title}</Card.Title>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-4 shrink-0 text-muted transition-[transform,color] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
          >
            <path d="M7 17 17 7M7 7h10v10" />
          </svg>
        </Card.Header>
        <Card.Description>{project.description}</Card.Description>
      </Card.Root>
    </a>
  );
}
