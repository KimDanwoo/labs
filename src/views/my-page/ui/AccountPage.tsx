'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/Avatar';
import { createClient } from '@/shared/config/supabase/client';
import { Mail, User } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [step, setStep] = useState<'idle' | 'confirm' | 'deleting'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleDelete = async () => {
    setStep('deleting');
    setError('');

    const res = await fetch('/api/account/delete', { method: 'DELETE' });

    if (!res.ok) {
      setError('계정 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      setStep('confirm');
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? '사용자';
  const email = user?.email ?? '';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight mb-2">계정 설정</h1>
      <p className="text-muted-foreground mb-8">계정 정보를 관리합니다.</p>

      {/* 계정 정보 */}
      <Card className="shadow-sm mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl} alt={`${displayName} 프로필`} />
              <AvatarFallback className="text-lg">
                {email.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{displayName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate block">{email}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Google 계정으로 로그인 중
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 회원 탈퇴 */}
      <div className="border-t pt-6" role="region" aria-label="회원 탈퇴" aria-live="polite">
        {step === 'idle' && (
          <button
            className="text-xs text-muted-foreground/60 hover:text-destructive transition-colors"
            onClick={() => setStep('confirm')}
          >
            회원 탈퇴
          </button>
        )}

        {step === 'confirm' && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
            <p className="text-sm font-medium">정말 탈퇴하시겠습니까?</p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>탈퇴 시 아래 데이터가 즉시 영구 삭제되며 복구할 수 없습니다.</p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                <li>계정 정보 (이메일, 프로필)</li>
                <li>학습 진도 및 연속 학습 기록</li>
                <li>북마크</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStep('idle'); setError(''); }}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                탈퇴하기
              </Button>
            </div>
          </div>
        )}

        {step === 'deleting' && (
          <p className="text-sm text-muted-foreground">계정을 삭제하는 중...</p>
        )}

        {error && (
          <p className="text-sm text-destructive mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
