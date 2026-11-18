import { atom } from 'jotai';

const LIBRARY_KEY = 'soundlab:library:v1';
const MAX_RECENT = 30;
const MAX_IDS = 10_000;
export const LISTEN_SOURCE = { all: 'all', collection: 'collection' } as const;
export type ListenSource = (typeof LISTEN_SOURCE)[keyof typeof LISTEN_SOURCE];
type Library = {
  favorites: number[];
  recent: number[];
  listenedMs: number;
  collectionMs: number;
  sessions: number;
  continuedSessions: number;
  firstPlayMs: number;
};
const EMPTY_LIBRARY: Library = {
  favorites: [],
  recent: [],
  listenedMs: 0,
  collectionMs: 0,
  sessions: 0,
  continuedSessions: 0,
  firstPlayMs: 0,
};

function isId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

export function parseLibrary(raw: unknown): Library {
  if (typeof raw !== 'object' || raw === null) return EMPTY_LIBRARY;
  const ids = (value: unknown): number[] =>
    Array.isArray(value) ? [...new Set(value.filter(isId))].slice(0, MAX_IDS) : [];
  const duration = (value: unknown): number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;
  return {
    favorites: ids('favorites' in raw ? raw.favorites : []),
    recent: ids('recent' in raw ? raw.recent : []).slice(0, MAX_RECENT),
    listenedMs: duration('listenedMs' in raw ? raw.listenedMs : 0),
    collectionMs: duration('collectionMs' in raw ? raw.collectionMs : 0),
    sessions: duration('sessions' in raw ? raw.sessions : 0),
    continuedSessions: duration('continuedSessions' in raw ? raw.continuedSessions : 0),
    firstPlayMs: duration('firstPlayMs' in raw ? raw.firstPlayMs : 0),
  };
}

function readLibrary(): Library {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(LIBRARY_KEY) ?? 'null');
    return parseLibrary(raw);
  } catch {
    return EMPTY_LIBRARY;
  }
}

export const storageNoticeAtom = atom('');
export const libraryAtom = atom<Library>(EMPTY_LIBRARY);
libraryAtom.onMount = (setLibrary) => {
  setLibrary(readLibrary());
  const handleStorage = (event: StorageEvent) => {
    if (event.key === LIBRARY_KEY || event.key === null) setLibrary(readLibrary());
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
};

const saveLibraryAtom = atom(null, (_get, set, next: Library) => {
  set(libraryAtom, next);
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
    set(storageNoticeAtom, '');
  } catch {
    set(storageNoticeAtom, '이 브라우저에서는 감상 기록을 저장할 수 없어 이번 방문에만 유지됩니다.');
  }
});

export const toggleFavoriteAtom = atom(null, (get, set, id: number) => {
  if (!isId(id)) return;
  const library = get(libraryAtom);
  const favorites = library.favorites.includes(id)
    ? library.favorites.filter((item) => item !== id)
    : [id, ...library.favorites].slice(0, MAX_IDS);
  set(saveLibraryAtom, { ...library, favorites });
});

export const recordListeningAtom = atom(
  null,
  (get, set, entry: { id: number; elapsedMs: number; source: ListenSource }) => {
    if (!isId(entry.id) || !Number.isFinite(entry.elapsedMs) || entry.elapsedMs <= 0) return;
    const library = get(libraryAtom);
    const elapsedMs = Math.round(Math.min(entry.elapsedMs, 10_000));
    set(saveLibraryAtom, {
      ...library,
      recent: [entry.id, ...library.recent.filter((id) => id !== entry.id)].slice(0, MAX_RECENT),
      listenedMs: library.listenedMs + elapsedMs,
      collectionMs: library.collectionMs + (entry.source === LISTEN_SOURCE.collection ? elapsedMs : 0),
    });
  },
);

export const clearHistoryAtom = atom(null, (get, set) => {
  set(saveLibraryAtom, { ...EMPTY_LIBRARY, favorites: get(libraryAtom).favorites });
});

export const SESSION_EVENT = { firstPlay: 'first-play', continued: 'continued' } as const;
export const recordSessionAtom = atom(
  null,
  (get, set, event: { kind: (typeof SESSION_EVENT)[keyof typeof SESSION_EVENT]; waitMs: number }) => {
    const library = get(libraryAtom);
    const isFirst = event.kind === SESSION_EVENT.firstPlay;
    const waitMs = Number.isFinite(event.waitMs) ? Math.max(0, Math.round(event.waitMs)) : 0;
    set(saveLibraryAtom, {
      ...library,
      sessions: library.sessions + (isFirst ? 1 : 0),
      continuedSessions: library.continuedSessions + (isFirst ? 0 : 1),
      firstPlayMs: library.firstPlayMs + (isFirst ? waitMs : 0),
    });
  },
);
