import Link from 'next/link';

import { FOOTER_NAV_LINKS, LEGAL_LINKS, SITE_NAME } from '../config/navigation';
import { styles } from './Footer.styles';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.brand}>{SITE_NAME}</span>
        <nav className={styles.nav} aria-label="푸터 네비게이션">
          {FOOTER_NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={styles.link}>
              {label}
            </Link>
          ))}
        </nav>
        <div className={styles.legal}>
          {LEGAL_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={styles.link}>
              {label}
            </Link>
          ))}
          <span>
            &copy; {new Date().getFullYear()} {SITE_NAME}
          </span>
        </div>
      </div>
    </footer>
  );
}
