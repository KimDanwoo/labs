'use client';

import { userProfileAtom } from '@entities/profile/model/store';
import type { UserProfile } from '@entities/profile/model/types';
import { firebaseUserAtom } from '@entities/user/model/store';
import { deleteAccount, signOutUser } from '@features/auth/model/hooks';
import { signInConsentOpenAtom } from '@features/auth/model/store';
import { enableNotifications } from '@features/notifications/model/hooks';
import { PrescriptionPreview, ProfileForm } from '@features/profile-setup/ui';
import { useMounted } from '@shared/lib';
import { Button } from '@ui/react';
import { AppHeader } from '@widgets/app-header/ui';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SettingsView() {
  const router = useRouter();
  const mounted = useMounted();
  const [profile, setProfile] = useAtom(userProfileAtom);
  const user = useAtomValue(firebaseUserAtom);
  const setConsentOpen = useSetAtom(signInConsentOpenAtom);
  const isAdmin = Boolean(process.env.NEXT_PUBLIC_ADMIN_UID) && user?.uid === process.env.NEXT_PUBLIC_ADMIN_UID;

  // 설정 폼은 로컬 draft로 편집한다. 글로벌 상태를 안 건드리므로 저장 계층(자동 영속)이 쏘지 않는다.
  // '저장'을 눌러야 draft를 글로벌 상태로 커밋 → 그때 1회 영속된다.
  const [draft, setDraft] = useState(profile);
  const [lastSaved, setLastSaved] = useState(profile);
  // 저장본(profile)이 외부에서 바뀌면(로그인 로드·기기 간 동기화) draft를 최신본으로 리셋 — 렌더 중 조정(effect 아님).
  if (profile !== lastSaved) {
    setLastSaved(profile);
    setDraft(profile);
  }

  const handleChange = (patch: Partial<UserProfile>) => setDraft((prev) => ({ ...prev, ...patch }));
  const isDirty = JSON.stringify(draft) !== JSON.stringify(profile);
  const handleSaveProfile = () => setProfile(draft);

  // 로그인은 약관 동의 시트를 거친다(시트에서 동의 후 실제 로그인 + 홈 이동).
  const handleSignIn = () => setConsentOpen(true);
  const handleSignOut = () => {
    void signOutUser().then(() => router.push('/'));
  };
  const handleNotifications = () => {
    if (!user) {
      return;
    }
    enableNotifications(user.uid)
      .then((ok) =>
        window.alert(ok ? '운동 알림이 켜졌어요.' : '알림을 켤 수 없어요(브라우저 미지원이거나 권한이 거부됐어요).'),
      )
      .catch(() => window.alert('알림 설정에 실패했어요.'));
  };
  const handleDeleteAccount = () => {
    if (!window.confirm('정말 탈퇴할까요? 모든 운동 기록·루틴과 계정이 영구 삭제되며 되돌릴 수 없어요.')) {
      return;
    }
    deleteAccount()
      .then(() => router.push('/'))
      .catch(() => window.alert('탈퇴에 실패했어요. 다시 로그인한 뒤 시도해 주세요.'));
  };

  return (
    <>
      <AppHeader title="설정" />
      <main className="mx-auto flex w-full max-w-mobile flex-col gap-lg px-lg pb-28 pt-lg">
        {mounted ? (
          <>
            <div className="flex flex-col gap-sm">
              <Link
                href="/routines"
                className="flex h-12 items-center justify-between rounded-lg border border-card-border bg-glass px-lg text-sm font-medium text-foreground transition-colors hover:bg-primary-subtle"
              >
                루틴 관리 <span className="text-muted-foreground">›</span>
              </Link>
              <Link
                href="/plan"
                className="flex h-12 items-center justify-between rounded-lg border border-card-border bg-glass px-lg text-sm font-medium text-foreground transition-colors hover:bg-primary-subtle"
              >
                주간 플랜 <span className="text-muted-foreground">›</span>
              </Link>
            </div>

            <ProfileForm value={draft} onChange={handleChange} showRest />
            <PrescriptionPreview profile={draft} />
            <div className="flex flex-col gap-xs">
              <Button className="h-12 w-full" disabled={!isDirty} onClick={handleSaveProfile}>
                {isDirty ? '변경사항 저장' : '저장됨'}
              </Button>
              <p className="text-xs text-muted-foreground">
                {isDirty ? '저장하지 않은 변경이 있어요.' : '모든 변경이 저장됐어요.'}
              </p>
            </div>

            <div className="mt-md flex flex-col gap-sm rounded-lg border border-card-border bg-glass p-lg">
              {user ? (
                <>
                  <span className="text-sm font-medium text-foreground">{user.email ?? '로그인됨'}</span>
                  <span className="text-xs text-muted-foreground">
                    기록이 클라우드에 저장돼 어느 기기에서나 이어져요.
                  </span>
                  <Button variant="outline" className="mt-sm h-11 w-full" onClick={handleNotifications}>
                    운동 알림 받기
                  </Button>
                  <Button variant="ghost" className="h-11 w-full text-muted-foreground" onClick={handleSignOut}>
                    로그아웃
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-foreground">클라우드 저장</span>
                  <span className="text-xs text-muted-foreground">
                    로그인하면 기록이 백업되고 다른 기기에서도 이어서 할 수 있어요.
                  </span>
                  <Button className="mt-sm h-11 w-full" onClick={handleSignIn}>
                    Google로 로그인
                  </Button>
                </>
              )}
            </div>

            {isAdmin && (
              <Link
                href="/admin"
                className="flex h-11 items-center justify-center rounded-md border border-card-border bg-glass text-sm font-medium text-foreground transition-colors hover:bg-primary-subtle"
              >
                루틴 관리(관리자)
              </Link>
            )}

            <div className="mt-md flex flex-col gap-sm border-t border-card-border pt-lg">
              <div className="flex gap-lg">
                <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground">
                  이용약관
                </Link>
                <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground">
                  개인정보처리방침
                </Link>
              </div>
              {user && (
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="self-start text-xs text-error hover:underline"
                >
                  회원 탈퇴
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">불러오는 중…</p>
        )}
      </main>
    </>
  );
}
