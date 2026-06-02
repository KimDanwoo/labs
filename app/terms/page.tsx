import type { Metadata } from 'next';
import Link from 'next/link';
import { TermsDocument } from '@entities/auth/ui';

export const metadata: Metadata = {
  title: '이용약관 · PLCO GOTCHI',
};

export default function TermsPage() {
  return (
    <main className="flex-1 px-5 py-6 space-y-5">
      <TermsDocument />
      <Link
        href="/"
        className="inline-block text-xs font-bold text-blue-500 btn-press"
      >
        ← 돌아가기
      </Link>
    </main>
  );
}
