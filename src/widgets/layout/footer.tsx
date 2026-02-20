import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto max-w-7xl px-4 h-[52px] flex items-center justify-between">
          <span className="text-sm font-medium">프딥</span>
          <nav className="flex gap-5 text-xs text-muted-foreground" aria-label="푸터 네비게이션">
            <Link href="/reference" className="hover:text-foreground transition-colors">
              레퍼런스
            </Link>
            <Link href="/learn/flashcard" className="hover:text-foreground transition-colors">
              학습하기
            </Link>
            <Link href="/search" className="hover:text-foreground transition-colors">
              검색
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} 프딥
          </p>
      </div>
    </footer>
  );
}
