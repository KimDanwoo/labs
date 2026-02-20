import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold">프딥</span>
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
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
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} 프딥
          </p>
        </div>
      </div>
    </footer>
  );
}
