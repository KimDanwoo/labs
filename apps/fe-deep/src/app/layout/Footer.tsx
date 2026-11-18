import Link from 'next/link';

import { FOOTER_NAV_LINKS, LEGAL_LINKS, SITE_NAME } from '../config/navigation';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm font-semibold tracking-tight">{SITE_NAME}</span>
        <nav className="flex gap-6 text-sm text-muted-foreground" aria-label="푸터 네비게이션">
          {FOOTER_NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-foreground transition-colors duration-200">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground/70">
          {LEGAL_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-foreground transition-colors duration-200">
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
