import { Fragment } from 'react';

import { PROFILE_PARAGRAPHS } from '../model/constants/profile-content';
import { isProfileLink } from '../model/types/profile';

const LINK_CLASS =
  'font-medium text-primary underline-offset-4 hover:underline transition-colors duration-150 hover:text-primary-accent';

export function ProfileHeader() {
  return (
    <header className="flex flex-col gap-xl">
      {/* ── 히어로 타이틀 영역 ─────────────────────────────── */}
      <div className="flex flex-col gap-md">
        {/* eyebrow 레이블 */}
        <div className="flex items-center gap-sm hero-enter" style={{ animationDelay: '0ms' }}>
          <span className="inline-flex h-px w-8 bg-primary" />
          <span className="font-display text-xs font-semibold uppercase tracking-widest text-primary">
            Frontend Engineer · Builder
          </span>
        </div>

        {/* 메인 디스플레이 타이틀 */}
        <h1
          className="font-display text-4xl font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground sm:text-5xl hero-enter"
          style={{ animationDelay: '80ms' }}
        >
          <span className="text-primary">김단우</span>
          <span className="block">의 실험실</span>
        </h1>

        {/* 서브타이틀 */}
        <p
          className="font-display text-base font-medium text-muted sm:text-lg hero-enter"
          style={{ animationDelay: '160ms' }}
        >
          아이디어를 빠르게 현실로 — AI와 함께.
        </p>
      </div>

      {/* ── 구분선 ──────────────────────────────────────────── */}
      <div className="h-px bg-card-border fade-up" style={{ animationDelay: '240ms' }} />

      {/* ── 본문 소개 ────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-md text-sm leading-[1.75] text-muted sm:text-base fade-up"
        style={{ animationDelay: '300ms' }}
      >
        {PROFILE_PARAGRAPHS.map((paragraph, paragraphIndex) => (
          <p key={paragraphIndex}>
            {paragraph.map((segment, segmentIndex) =>
              isProfileLink(segment) ? (
                <a key={segmentIndex} href={segment.href} target="_blank" rel="noreferrer" className={LINK_CLASS}>
                  {segment.label}
                </a>
              ) : (
                <Fragment key={segmentIndex}>{segment}</Fragment>
              ),
            )}
          </p>
        ))}
      </div>
    </header>
  );
}
