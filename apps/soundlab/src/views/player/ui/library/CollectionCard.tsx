import { TRACKS } from '@entities/track';
import { Button } from '@shared/ui/Button';
import { useAtomValue, useSetAtom } from 'jotai';
import type { JSX } from 'react';
import type { Collection } from '../../config/collections';
import { MS_PER_MINUTE } from '../../config/time';
import { collectionFilterAtom, LIBRARY_FILTER, libraryFilterAtom, searchAtom } from '../../model/browse';
import { usePlaybackControls } from '../../model/hooks/usePlaybackControls';

type Props = { collection: Collection };
export function CollectionCard({ collection }: Props): JSX.Element {
  const { startQueue } = usePlaybackControls();
  const selected = useAtomValue(collectionFilterAtom);
  const setCollection = useSetAtom(collectionFilterAtom);
  const setFilter = useSetAtom(libraryFilterAtom);
  const setSearch = useSetAtom(searchAtom);
  const ids = collection.trackIds.filter((id) =>
    TRACKS.some((track) => track.id === id && track.isAvailable !== false),
  );
  const minutes = Math.round(
    TRACKS.filter((track) => ids.includes(track.id)).reduce((sum, track) => sum + track.durationMs, 0) / MS_PER_MINUTE,
  );
  const handleBrowse = () => {
    setCollection(selected === collection.id ? null : collection.id);
    setFilter(LIBRARY_FILTER.all);
    setSearch('');
  };
  const handlePlay = () => {
    setCollection(collection.id);
    setFilter(LIBRARY_FILTER.all);
    setSearch('');
    startQueue({ ids, label: collection.title });
  };
  return (
    <div className="flex items-center gap-md border-b border-hairline py-sm">
      <button
        type="button"
        aria-pressed={selected === collection.id}
        className="w-full rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-brass"
        onClick={handleBrowse}
      >
        <span className="mt-xs block text-base text-paper">{collection.title}</span>
        <span className="mt-xs block text-xs text-dim">
          {ids.length}곡 · {minutes}분
        </span>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0 text-paper"
        disabled={!ids.length}
        aria-label={`${collection.title} 세트 재생`}
        onClick={handlePlay}
      >
        재생
      </Button>
    </div>
  );
}
