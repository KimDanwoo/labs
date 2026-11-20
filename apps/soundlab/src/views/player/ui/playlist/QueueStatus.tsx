import { playbackQueueAtom } from '@views/player/model/store/playback';
import { useAtomValue } from 'jotai';

export function QueueStatus() {
  const queue = useAtomValue(playbackQueueAtom);
  if (!queue) return null;
  return (
    <p className="text-xs text-brass" role="status">
      재생 중인 순서 · {queue.label} · {queue.ids.length}곡
    </p>
  );
}
