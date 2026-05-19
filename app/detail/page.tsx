import { Suspense } from 'react';

import { DestinyDetailView } from '@views/destiny-detail';

export default function DetailPage() {
  return (
    <main className="min-h-screen">
      <Suspense>
        <DestinyDetailView />
      </Suspense>
    </main>
  );
}
