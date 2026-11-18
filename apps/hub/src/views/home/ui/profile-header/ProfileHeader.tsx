import { Fragment } from 'react';

import { REVEAL_DELAY_MS } from '../../config/motion';
import { revealDelay } from '../../lib/revealDelay';
import { HEADLINE_KEYWORDS, PROFILE_PARAGRAPHS } from '../../model/constants/profileContent';
import { isProfileLink } from '../../model/types/profile';
import { styles } from './ProfileHeader.styles';
import { RevealWord } from './RevealWord';
import { ScrambleKeyword } from './ScrambleKeyword';

export function ProfileHeader() {
  return (
    <header className={styles.header}>
      <div aria-hidden="true" className={styles.glow} />

      <h1 className={styles.title}>
        <RevealWord order={0}>
          <ScrambleKeyword keywords={HEADLINE_KEYWORDS} />
        </RevealWord>
        <br />
        <RevealWord order={1}>
          <span className={styles.flowText}>프로덕트</span>
        </RevealWord>{' '}
        <RevealWord order={2}>
          <span className={styles.flowText}>엔지니어</span>예요
        </RevealWord>
      </h1>

      <div aria-hidden="true" className={styles.divider} style={revealDelay(REVEAL_DELAY_MS.divider)} />

      <div className={styles.intro} style={revealDelay(REVEAL_DELAY_MS.intro)}>
        {PROFILE_PARAGRAPHS.map((paragraph, paragraphIndex) => (
          <p key={paragraphIndex}>
            {paragraph.map((segment, segmentIndex) =>
              isProfileLink(segment) ? (
                <a
                  key={segmentIndex}
                  href={segment.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  {segment.label}
                  <span className="sr-only"> (새 탭에서 열림)</span>
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
