export const COLLECTION_ID = { night: 'night', walk: 'walk', rain: 'rain' } as const;
export type Collection = {
  id: string;
  title: string;
  trackIds: readonly number[];
};

export const COLLECTIONS: readonly Collection[] = [
  {
    id: COLLECTION_ID.night,
    title: '늦은 밤',
    trackIds: [2401225464, 2426752887, 2418592806, 2401284951, 2420178204],
  },
  {
    id: COLLECTION_ID.walk,
    title: '산책',
    trackIds: [2393574927, 2397767070, 2400822987, 2417418270, 2414585238],
  },
  {
    id: COLLECTION_ID.rain,
    title: '비 오는 날',
    trackIds: [2426753214, 2398576149, 2422491189, 2417412714, 2397772944],
  },
];

export function collectionsForTrack(id: number): readonly Collection[] {
  return COLLECTIONS.filter((collection) => collection.trackIds.includes(id));
}
