'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Plus, ExternalLink, MessageSquare } from 'lucide-react';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { cn } from '@/shared/lib/utils';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: '대시보드', exact: true },
  { href: '/admin/questions', icon: FileText, label: '질문 관리', exact: false },
  { href: '/admin/questions/new', icon: Plus, label: '새 질문', exact: true },
  { href: '/admin/feedbacks', icon: MessageSquare, label: '피드백', exact: true },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen min-w-[340px] flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-muted/30 p-4 gap-1 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-3 px-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Admin
          </p>
          <ThemeToggle />
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <NavLink key={item.href} href={item.href} active={isActive}>
              <Icon className="size-4" />
              {item.label}
            </NavLink>
          );
        })}
        <div className="mt-auto pt-4 border-t">
          <NavLink href="/">
            <ExternalLink className="size-4" />
            유저 페이지로
          </NavLink>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 h-12">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Admin
        </p>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            나가기
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur safe-area-bottom">
        <div className="flex items-center justify-around h-14 min-w-[340px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors',
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        active
          ? 'text-foreground bg-muted font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
    >
      {children}
    </Link>
  );
}
