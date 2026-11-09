import { ProjectCard, PROJECTS } from '@entities/project';

import { SpotlightGrid } from './SpotlightGrid';

/** 카드 등장 스태거 기준(ms). 섹션 헤더 등장 후 시작한다. */
const GRID_STAGGER_BASE_MS = 80;

export function ProjectGrid() {
  return (
    <section className="flex flex-col gap-xl">
      <div className="flex items-center gap-md fade-up" style={{ animationDelay: '360ms' }}>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Labs</h2>
        <span
          aria-hidden="true"
          className="rounded-full border border-card-border px-sm py-xs font-mono text-xs text-muted-foreground tabular-nums"
        >
          {String(PROJECTS.length).padStart(2, '0')}
        </span>
        <span className="sr-only">프로젝트 {PROJECTS.length}개</span>
        <div className="h-px flex-1 bg-linear-to-r from-card-border to-transparent" />
      </div>

      <SpotlightGrid className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((project, index) => (
          <ProjectCard key={project.href} project={project} index={index} staggerBaseMs={GRID_STAGGER_BASE_MS} />
        ))}
      </SpotlightGrid>
    </section>
  );
}
