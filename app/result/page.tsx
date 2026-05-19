import { Suspense } from 'react';

import { DestinyResultView } from '@views/destiny-result';

export default function ResultPage() {
  return (
    <main className="min-h-screen max-w-[500px] mx-auto">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-gold border-t-transparent animate-spin" />
              <p className="text-sm text-gold">분석 중...</p>
            </div>
          </div>
        }
      >
        <DestinyResultView />
      </Suspense>
    </main>
  );
}
