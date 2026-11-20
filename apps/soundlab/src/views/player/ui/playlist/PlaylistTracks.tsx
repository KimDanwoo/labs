import { Button } from '@shared/ui/Button';
import { searchAtom, visibleTracksAtom } from '@views/player/model/browse';
import { LibraryTrack } from '@views/player/ui/library/LibraryTrack';
import { useAtomValue, useSetAtom } from 'jotai';

export function PlaylistTracks() {
  const tracks = useAtomValue(visibleTracksAtom);
  const setSearch = useSetAtom(searchAtom);
  if (tracks.length)
    return tracks.map((track, position) => <LibraryTrack key={track.id} track={track} position={position} />);
  return (
    <div className="p-lg text-center text-sm leading-relaxed text-dim">
      <p>표시할 곡이 없습니다.</p>
      <Button type="button" variant="ghost" className="mt-sm" onClick={() => setSearch('')}>
        검색어 지우기
      </Button>
    </div>
  );
}
