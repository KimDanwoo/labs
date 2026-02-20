'use client';

import { Suspense } from 'react';
import { SearchContent } from './_components/search-content';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-4xl px-4 py-8">로딩 중...</div>}>
      <SearchContent />
    </Suspense>
  );
}
