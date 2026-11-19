import { useAtomValue } from 'jotai';
import { playbackQueueAtom } from '../../model/store/playback';

export function QueueStatus() {
  const queue = useAtomValue(playbackQueueAtom);
  if (!queue) return null;
  return (
    <p className="text-xs text-brass" role="status">
      재생 중인 순서 · {queue.label} · {queue.ids.length}곡
    </p>
  );
}
