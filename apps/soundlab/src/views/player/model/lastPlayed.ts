import { readSharedStartMs } from '../lib/playerUrl';

const LAST_PLAYED_KEY = 'soundlab:last-played';

type LastPlayed = { id: number; ms: number };

function parseLastPlayed(parsed: unknown): LastPlayed | null {
  if (typeof parsed !== 'object' || parsed === null) return null;
  if (!('id' in parsed) || !('ms' in parsed)) return null;
  const { id, ms } = parsed;
  if (typeof id !== 'number' || !Number.isInteger(id)) return null;
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return null;
  return { id, ms };
}

export function readLastPlayed(): LastPlayed | null {
  try {
    const raw = localStorage.getItem(LAST_PLAYED_KEY);
    if (!raw) return null;
    return parseLastPlayed(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeLastPlayed(last: LastPlayed): void {
  try {
    localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(last));
  } catch {
    return;
  }
}

export function readStartTarget(sharedTrackId: number | undefined): LastPlayed | null {
  if (sharedTrackId === undefined) return readLastPlayed();
  const ms = readSharedStartMs(window.location.search);
  return ms === null ? null : { id: sharedTrackId, ms };
}
