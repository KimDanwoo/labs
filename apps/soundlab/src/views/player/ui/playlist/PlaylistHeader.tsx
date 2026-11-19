import { TRACKS } from '@entities/track';

export function PlaylistHeader() {
  const availableCount = TRACKS.filter((track) => track.isAvailable !== false).length;
  return (
    <div className="border-b border-hairline p-md pr-3xl">
      <h1 className="font-label text-sm tracking-mark text-paper">SOUNDLAB</h1>
      <p className="mt-xs text-xs text-dim">{availableCount}곡</p>
    </div>
  );
}
