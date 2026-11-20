import { COLLECTIONS } from '@views/player/config/collections';
import { CollectionCard } from '@views/player/ui/library/CollectionCard';

export function PlaylistCollections() {
  return (
    <details>
      <summary className="cursor-pointer text-xs text-dim">플레이리스트</summary>
      <div className="mt-md flex flex-col">
        {COLLECTIONS.map((item) => (
          <CollectionCard key={item.id} collection={item} />
        ))}
      </div>
    </details>
  );
}
