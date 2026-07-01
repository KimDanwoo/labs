'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@shared/config/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * 계정 설정 페이지의 유저 정보 로드, 탈퇴 처리, 바텀시트 상태를 관리한다.
 */
export function useAccount() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    const res = await fetch('/api/account/delete', { method: 'DELETE' });

    if (!res.ok) {
      setError('계정 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      setDeleting(false);
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleOpenChange = (v: boolean) => {
    if (deleting) return;
    setOpen(v);
    if (!v) setError('');
  };

  const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '사용자';
  const email = user?.email ?? '';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return { displayName, email, avatarUrl, open, deleting, error, handleDelete, handleOpenChange };
}
