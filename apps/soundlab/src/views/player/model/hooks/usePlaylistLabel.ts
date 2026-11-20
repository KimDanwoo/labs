import { COLLECTIONS } from '@views/player/config/collections';
import { collectionFilterAtom, FILTER_LABELS, libraryFilterAtom } from '@views/player/model/browse';
import { useAtomValue } from 'jotai';

export function usePlaylistLabel(): string {
  const filter = useAtomValue(libraryFilterAtom);
  const selectedCollection = useAtomValue(collectionFilterAtom);
  const collection = COLLECTIONS.find((item) => item.id === selectedCollection);
  return collection?.title ?? FILTER_LABELS[filter];
}
