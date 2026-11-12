import { libraryAtom, playbackQueueAtom, TRACKS } from '@entities/track';
import { atom } from 'jotai';
import { COLLECTIONS } from '../config/collections';

export const LIBRARY_FILTER = { all: 'all', favorites: 'favorites', recent: 'recent', queue: 'queue' } as const;
export type LibraryFilter = (typeof LIBRARY_FILTER)[keyof typeof LIBRARY_FILTER];
export const FILTER_LABELS = {
  all: '모든 곡',
  favorites: '즐겨찾기',
  recent: '최근 감상',
  queue: '재생 순서',
} satisfies Record<LibraryFilter, string>;
export const searchAtom = atom('');
export const libraryFilterAtom = atom<LibraryFilter>(LIBRARY_FILTER.all);
export const collectionFilterAtom = atom<string | null>(null);

export function normalizeSearch(value: string): string {
  return value.normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim().slice(0, 120);
}

export const visibleTracksAtom = atom((get) => {
  const library = get(libraryAtom);
  const filter = get(libraryFilterAtom);
  const collection = COLLECTIONS.find((item) => item.id === get(collectionFilterAtom));
  const queue = get(playbackQueueAtom);
  const idsByFilter = {
    [LIBRARY_FILTER.all]: collection?.trackIds,
    [LIBRARY_FILTER.favorites]: library.favorites,
    [LIBRARY_FILTER.recent]: library.recent,
    [LIBRARY_FILTER.queue]: queue?.ids,
  };
  const ids = idsByFilter[filter];
  const byId = new Map(TRACKS.map((track) => [track.id, track]));
  const tracks = ids
    ? ids.flatMap((id) => {
        const track = byId.get(id);
        return track ? [track] : [];
      })
    : TRACKS;
  const query = normalizeSearch(get(searchAtom));
  return tracks.filter(
    (track) => track.isAvailable !== false && normalizeSearch(`${track.title} ${track.genre}`).includes(query),
  );
});
