import { COLLECTIONS } from '../../config/collections';
import { CollectionCard } from '../library/CollectionCard';

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
