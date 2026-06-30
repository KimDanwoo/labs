import { PROJECTS } from '@entities/project/model/constants';
import { ProjectCard } from '@entities/project/ui';

/** 카드 등장 스태거 기준(ms). 섹션 헤더 등장 후 시작한다. */
const GRID_STAGGER_BASE_MS = 80;

export function ProjectGrid() {
  return (
    <section className="flex flex-col gap-2xl">
      {/* ── 섹션 헤더 ─────────────────────────────────────── */}
      <div className="flex items-baseline gap-md fade-up" style={{ animationDelay: '360ms' }}>
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">Labs</h2>
        <span className="font-display text-sm font-semibold tabular-nums text-primary">{PROJECTS.length}</span>
      </div>

      {/* ── 카드 그리드 ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((project, index) => (
          <ProjectCard key={project.href} project={project} index={index} staggerBaseMs={GRID_STAGGER_BASE_MS} />
        ))}
      </div>
    </section>
  );
}
