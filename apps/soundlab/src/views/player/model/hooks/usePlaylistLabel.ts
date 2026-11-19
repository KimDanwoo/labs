import { useAtomValue } from 'jotai';
import { COLLECTIONS } from '../../config/collections';
import { collectionFilterAtom, FILTER_LABELS, libraryFilterAtom } from '../browse';

export function usePlaylistLabel(): string {
  const filter = useAtomValue(libraryFilterAtom);
  const selectedCollection = useAtomValue(collectionFilterAtom);
  const collection = COLLECTIONS.find((item) => item.id === selectedCollection);
  return collection?.title ?? FILTER_LABELS[filter];
}
