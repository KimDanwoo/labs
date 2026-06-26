import * as Card from '@ui/react/card';

import type { Project } from '@entities/project/model/types';

/** 이미지 없는 카드의 폴백 단색 배경 (Tailwind 스캔 가능 리터럴) */
const FALLBACK_BG = [
  'bg-primary-subtle',
  'bg-success-subtle',
  'bg-info-subtle',
  'bg-warning-subtle',
  'bg-secondary-subtle',
] as const;

/** 폴백 커버의 이니셜 색상 */
const FALLBACK_FG = ['text-primary', 'text-success', 'text-info', 'text-warning', 'text-secondary'] as const;

/** 커버 이미지 정렬 */
const IMAGE_POSITION = {
  top: 'object-top',
  center: 'object-center',
} as const;

/** ArrowUpRight 아이콘 — 외부 링크 방향성 */
function ArrowUpRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-3.5 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
    >
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

type ProjectCardProps = {
  project: Project;
  index: number;
  staggerBaseMs: number;
};

export function ProjectCard({ project, index, staggerBaseMs }: ProjectCardProps) {
  const fallbackBg = FALLBACK_BG[index % FALLBACK_BG.length] ?? FALLBACK_BG[0];
  const fallbackFg = FALLBACK_FG[index % FALLBACK_FG.length] ?? FALLBACK_FG[0];
  const imagePosition = IMAGE_POSITION[project.imagePosition ?? 'top'];

  return (
    <a
      href={project.href}
      target="_blank"
      rel="noreferrer"
      className="group block fade-up"
      style={{ animationDelay: `${420 + index * staggerBaseMs}ms` }}
    >
      <Card.Root className="h-full overflow-hidden rounded-xl border-card-border bg-card transition-[transform,border-color] duration-250 ease-out will-change-transform group-hover:-translate-y-1.5 group-hover:border-primary/50">
        {/* ── 커버 영역 ─────────────────────────────────── */}
        <div className="relative -mx-lg -mt-lg flex h-40 items-center justify-center overflow-hidden sm:h-44">
          {project.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.image}
              alt={project.title}
              className={`size-full object-cover ${imagePosition} transition-transform duration-500 ease-out group-hover:scale-[1.03]`}
            />
          ) : (
            <div className={`absolute inset-0 flex items-center justify-center ${fallbackBg}`}>
              <span
                className={`font-display text-5xl font-extrabold tracking-tight select-none ${fallbackFg} transition-transform duration-400 ease-out group-hover:scale-105`}
              >
                {project.title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* ── 카드 본문 ─────────────────────────────────── */}
        <Card.Header className="pt-md">
          <div className="flex flex-col gap-xs">
            <Card.Title className="font-display text-base font-semibold tracking-[-0.01em] transition-colors duration-200 group-hover:text-primary">
              {project.title}
            </Card.Title>
          </div>
          {/* 링크 아이콘 */}
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-card-border bg-card text-muted transition-all duration-200 group-hover:border-primary group-hover:text-primary">
            <ArrowUpRightIcon />
          </span>
        </Card.Header>

        <Card.Description className="text-xs leading-relaxed sm:text-sm">{project.description}</Card.Description>
      </Card.Root>
    </a>
  );
}
