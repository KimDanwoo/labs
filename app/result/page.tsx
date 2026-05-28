import ReactDOM from 'react-dom';

import { DestinyResultView } from '@views/destiny-result';

export default function ResultPage() {
  ReactDOM.preload('/result_9.webp', { as: 'image', fetchPriority: 'high' });

  return (
    <main className="min-h-screen max-w-[500px] mx-auto">
      <DestinyResultView />
    </main>
  );
}
