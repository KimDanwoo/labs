import Link from 'next/link';

import { SITE_NAME } from '../config/page';
import { styles } from './SiteHeader.styles';
import { ThemeToggle } from './theme-toggle/ThemeToggle';

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" aria-label={`${SITE_NAME} 홈`} className={styles.brandLink}>
          <span className={styles.brandDot} />
          <span className={styles.brandName}>{SITE_NAME}</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
