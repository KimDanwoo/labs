import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchContent } from './_components/search-content';

export const metadata: Metadata = {
  title: '검색',
  description: '프론트엔드 면접 질문과 답변을 키워드로 검색하세요.',
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-4xl px-4 py-8">로딩 중...</div>}>
      <SearchContent />
    </Suspense>
  );
}
