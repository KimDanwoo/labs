import { Button } from '@shared/ui/Button';
import { useAtomValue } from 'jotai';
import { visibleTracksAtom } from '../../model/browse';
import { usePlaybackControls } from '../../model/hooks/usePlaybackControls';
import { usePlaylistLabel } from '../../model/hooks/usePlaylistLabel';

export function PlaylistSummary() {
  const tracks = useAtomValue(visibleTracksAtom);
  const label = usePlaylistLabel();
  const { startQueue } = usePlaybackControls();
  const handlePlayAll = () => startQueue({ ids: tracks.map((track) => track.id), label });
  return (
    <div className="flex items-center justify-between gap-sm">
      <p className="text-sm" aria-live="polite">
        {label} · {tracks.length}곡
      </p>
      <Button type="button" variant="ghost" size="sm" disabled={!tracks.length} onClick={handlePlayAll}>
        이 목록 재생
      </Button>
    </div>
  );
}
