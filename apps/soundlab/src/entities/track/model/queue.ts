import type { Track } from './types/track';

export type PlaybackQueue = { ids: readonly number[]; label: string };

export function playableIds(tracks: readonly Track[]): number[] {
  return tracks.filter((track) => track.isAvailable !== false).map((track) => track.id);
}

export function resolveQueue(tracks: readonly Track[], ids: readonly number[]): number[] {
  const available = new Set(playableIds(tracks));
  return [...new Set(ids)].filter((id) => available.has(id));
}

export function adjacentTrack(options: {
  ids: readonly number[];
  currentId: number;
  direction: 1 | -1;
  random?: number;
}): number | undefined {
  const { ids, currentId, direction, random } = options;
  if (!ids.length) return undefined;
  if (random !== undefined && ids.length > 1) {
    const others = ids.filter((id) => id !== currentId);
    return others[Math.min(others.length - 1, Math.floor(Math.max(0, random) * others.length))];
  }
  const current = ids.indexOf(currentId);
  if (current < 0) return direction === 1 ? ids[0] : ids.at(-1);
  return ids[(current + direction + ids.length) % ids.length];
}
