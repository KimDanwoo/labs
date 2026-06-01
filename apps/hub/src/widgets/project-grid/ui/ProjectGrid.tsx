import { Badge } from '@ui/react';

import { PROJECTS } from '@entities/project/model/constants';
import { ProjectCard } from '@entities/project/ui';

export function ProjectGrid() {
  return (
    <section className="flex flex-col gap-lg">
      <div className="flex flex-col gap-xs">
        <div className="flex items-center gap-sm">
          <h2 className="text-2xl font-semibold text-foreground">Labs</h2>
          <Badge tone="primary">{PROJECTS.length} projects</Badge>
        </div>
        <p className="text-sm text-muted">작은 아이디어들을 빠르게 만들고 실험하는 공간</p>
      </div>
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((project, index) => (
          <ProjectCard key={project.href} project={project} index={index} />
        ))}
      </div>
    </section>
  );
}
