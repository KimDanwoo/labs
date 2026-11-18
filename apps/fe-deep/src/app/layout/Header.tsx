import Link from 'next/link';

import { SITE_NAME } from '../config/navigation';
import { DesktopNav } from './DesktopNav';
import { styles } from './Header.styles';
import { MobileNav } from './MobileNav';
import { MyPageMenu } from './MyPageMenu';
import { ThemeToggle } from './theme-toggle/ThemeToggle';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandWide}>{SITE_NAME}</span>
          <span className={styles.brandNarrow}>{SITE_NAME}</span>
        </Link>

        <DesktopNav />

        <div className={styles.actions}>
          <ThemeToggle />
          <MyPageMenu />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
