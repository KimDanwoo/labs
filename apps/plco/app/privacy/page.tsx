import type { Metadata } from 'next';
import Link from 'next/link';
import { PrivacyDocument } from '@entities/auth/ui';

export const metadata: Metadata = {
  title: '개인정보처리방침 · PLCO GOTCHI',
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 px-5 py-6 space-y-5">
      <PrivacyDocument />
      <Link
        href="/"
        className="inline-block text-xs font-bold text-blue-500 btn-press"
      >
        ← 돌아가기
      </Link>
    </main>
  );
}
