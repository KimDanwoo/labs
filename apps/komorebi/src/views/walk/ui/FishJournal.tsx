import { type FishCollection } from '@views/walk/lib/fishing';
import { FISH } from '@views/walk/lib/fishTable';

interface FishJournalProps {
  collection: FishCollection;
}

export function FishJournal({ collection }: FishJournalProps) {
  return (
    <details className="pier-journal">
      <summary>
        바다 도감 · {Object.keys(collection).length} / {FISH.length}
      </summary>
      {FISH.map((item) => {
        const record = collection[item.id];
        return (
          <div className="fishing-entry" key={item.id}>
            <span>{record ? `${item.symbol} ${item.name}` : '아직 만나지 못한 물고기'}</span>
            <small>{record ? `${item.rarity} · ${record.count}마리 · 최대 ${record.best} cm` : item.rarity}</small>
          </div>
        );
      })}
    </details>
  );
}
