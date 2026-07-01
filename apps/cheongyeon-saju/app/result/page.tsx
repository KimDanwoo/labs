import ReactDOM from 'react-dom';

import { DestinyResultView } from '@views/destiny-result';

export default function ResultPage() {
  ReactDOM.preload('/result_9.webp', { as: 'image', fetchPriority: 'high' });

  return (
    <main className="min-h-screen max-w-[500px] mx-auto relative bg-white">
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 aspect-450/600 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/result_9.webp)' }}
      />
      <DestinyResultView />
    </main>
  );
}
