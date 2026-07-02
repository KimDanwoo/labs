'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@shared/lib';
import { AdminQueryProvider } from '@features/admin/ui';

type GuardState = 'checking' | 'authed';

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<GuardState>('checking');

  useEffect(() => {
    let active = true;

    const verify = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active) router.replace('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!active) return;

      if (profile?.is_admin === true) {
        setState('authed');
      } else {
        router.replace('/');
      }
    };

    verify();
    return () => {
      active = false;
    };
  }, [router]);

  if (state !== 'authed') {
    return (
      <div className="w-full px-4 py-12 text-center text-xs text-muted">
        확인 중...
      </div>
    );
  }

  return (
    <AdminQueryProvider>
      <div className="w-full px-4 py-5 space-y-4">
        <header className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">PLCO 관리자</span>
          <Link
            href="/"
            className="text-[11px] font-bold text-muted hover:text-foreground transition-colors btn-press"
          >
            ← 게임으로
          </Link>
        </header>
        {children}
      </div>
    </AdminQueryProvider>
  );
}
