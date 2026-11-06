import { Fragment } from 'react';

import { HEADLINE_KEYWORDS, PROFILE_PARAGRAPHS } from '@widgets/profile-header/model/constants';
import { isProfileLink } from '@widgets/profile-header/model/types';

import { RevealWord } from './RevealWord';
import { ScrambleKeyword } from './ScrambleKeyword';

const LINK_CLASS =
  'font-medium text-primary underline-offset-4 hover:underline transition-colors duration-150 hover:text-primary-accent';

export function ProfileHeader() {
  return (
    <header className="relative isolate flex flex-col gap-xl py-xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 -z-10 size-72 rounded-full bg-glow blur-3xl hero-glow"
      />

      <h1 className="origin-left font-display text-3xl leading-tight font-bold tracking-tight text-foreground hero-recede min-[400px]:text-4xl sm:text-5xl lg:text-6xl">
        <RevealWord order={0}>
          <ScrambleKeyword keywords={HEADLINE_KEYWORDS} />
        </RevealWord>
        <br />
        <RevealWord order={1}>
          <span className="text-flow">프론트엔드</span>
        </RevealWord>{' '}
        <RevealWord order={2}>
          <span className="text-flow">엔지니어</span>예요
        </RevealWord>
      </h1>

      <div
        className="h-px bg-linear-to-r from-card-border to-transparent fade-up"
        style={{ animationDelay: '240ms' }}
      />

      <div
        className="flex max-w-(--container-3xl) flex-col gap-md text-sm leading-[1.75] text-muted-foreground sm:text-base fade-up"
        style={{ animationDelay: '300ms' }}
      >
        {PROFILE_PARAGRAPHS.map((paragraph, paragraphIndex) => (
          <p key={paragraphIndex}>
            {paragraph.map((segment, segmentIndex) =>
              isProfileLink(segment) ? (
                <a
                  key={segmentIndex}
                  href={segment.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK_CLASS}
                >
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
