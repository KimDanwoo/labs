'use client';

import { Button } from '@ui/react';
import { useAtom } from 'jotai';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signInWithGoogle } from '../model/hooks';
import { signInConsentOpenAtom } from '../model/store';

// 로그인 전 약관 동의 시트(전역). 동의해야 실제 Google 로그인이 진행된다.
export function SignInConsent() {
  const [open, setOpen] = useAtom(signInConsentOpenAtom);
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();

  if (!open) {
    return null;
  }

  const close = () => {
    setOpen(false);
    setAgreed(false);
  };

  const handleAgree = () => {
    void signInWithGoogle()
      .then(() => {
        close();
        router.push('/');
      })
      .catch(() => close());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 px-lg pb-3xl backdrop-blur-sm">
      <div className="pop flex w-full max-w-content flex-col gap-lg rounded-xl border border-card-border bg-glass p-xl">
        <div className="flex flex-col gap-sm">
          <h2 className="text-lg font-bold text-foreground">시작하기 전에</h2>
          <p className="text-sm text-muted">서비스 이용을 위해 약관에 동의해 주세요.</p>
        </div>

        <div className="flex gap-lg">
          <Link href="/terms" className="text-sm font-medium text-primary hover:underline">
            이용약관
          </Link>
          <Link href="/privacy" className="text-sm font-medium text-primary hover:underline">
            개인정보처리방침
          </Link>
        </div>

        <label className="flex items-center gap-sm text-sm text-foreground">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="size-5 accent-primary"
          />
          이용약관과 개인정보처리방침에 동의합니다
        </label>

        <div className="flex flex-col gap-sm">
          <Button disabled={!agreed} className="h-12 w-full" onClick={handleAgree}>
            동의하고 Google로 로그인
          </Button>
          <Button variant="ghost" className="h-10 w-full text-sm text-muted" onClick={close}>
            취소
          </Button>
        </div>
      </div>
    </div>
  );
}
