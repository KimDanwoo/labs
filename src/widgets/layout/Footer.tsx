import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold tracking-tight">프딥</span>
          <nav className="flex gap-6 text-sm text-muted-foreground" aria-label="푸터 네비게이션">
            <Link href="/reference" className="hover:text-foreground transition-colors duration-200">
              레퍼런스
            </Link>
            <Link href="/learn/flashcard" className="hover:text-foreground transition-colors duration-200">
              학습하기
            </Link>
            <Link href="/search" className="hover:text-foreground transition-colors duration-200">
              검색
            </Link>
          </nav>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground/70">
            <Link href="/privacy" className="hover:text-foreground transition-colors duration-200">
              개인정보 처리방침
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors duration-200">
              이용약관
            </Link>
            <span>&copy; {new Date().getFullYear()} 프딥</span>
          </div>
      </div>
    </footer>
  );
}
