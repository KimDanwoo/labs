import { Fragment } from 'react';
import { PROFILE_PARAGRAPHS } from '../model/constants/profile-content';
import { isProfileLink } from '../model/types/profile';

const LINK_CLASS = 'font-medium text-primary underline-offset-4 hover:underline';

export function ProfileHeader() {
  return (
    <header className="flex max-w-content flex-col gap-md text-base leading-relaxed text-muted fade-up">
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
    </header>
  );
}
