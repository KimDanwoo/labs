import { Fragment } from 'react';

import { PROFILE_PARAGRAPHS } from '../model/constants/profileContent';
import { isProfileLink } from '../model/types/profile';

const LINK_CLASS =
  'font-medium text-primary underline-offset-4 hover:underline transition-colors duration-150 hover:text-primary-accent';

export function ProfileHeader() {
  return (
    <header className="flex flex-col gap-xl">
      {/* ── eyebrow 레이블 ─────────────────────────────────── */}
      <div className="flex items-center gap-sm hero-enter" style={{ animationDelay: '0ms' }}>
        <span className="inline-flex h-px w-8 bg-primary" />
        <span className="font-display text-xs font-semibold uppercase tracking-widest text-primary">
          Frontend Engineer · Builder
        </span>
      </div>

      {/* ── 구분선 ──────────────────────────────────────────── */}
      <div className="h-px bg-card-border fade-up" style={{ animationDelay: '240ms' }} />

      {/* ── 본문 소개 ────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-md text-sm leading-[1.75] text-muted-foreground sm:text-base fade-up"
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
