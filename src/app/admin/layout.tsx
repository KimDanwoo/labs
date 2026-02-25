import Link from 'next/link';
import { LayoutDashboard, FileText, Plus, ExternalLink } from 'lucide-react';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-56 flex-col border-r bg-muted/30 p-4 gap-1">
        <div className="flex items-center justify-between mb-3 px-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Admin
          </p>
          <ThemeToggle />
        </div>
        <NavLink href="/admin" icon={<LayoutDashboard className="size-4" />}>
          대시보드
        </NavLink>
        <NavLink
          href="/admin/questions"
          icon={<FileText className="size-4" />}
        >
          질문 관리
        </NavLink>
        <NavLink
          href="/admin/questions/new"
          icon={<Plus className="size-4" />}
        >
          새 질문
        </NavLink>

        <div className="mt-auto pt-4 border-t">
          <NavLink href="/" icon={<ExternalLink className="size-4" />}>
            유저 페이지로
          </NavLink>
        </div>
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
