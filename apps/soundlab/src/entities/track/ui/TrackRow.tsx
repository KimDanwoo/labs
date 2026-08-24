import { hueOf } from '../model/constants';
import type { Track } from '../model/types';
import { LevelMeter } from './LevelMeter';

type TrackRowProps = {
  track: Track;
  index: number;
  isCurrent: boolean;
  onSelect: (index: number) => void;
};

const clock = (ms: number) => {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

export function TrackRow({ track, index, isCurrent, onSelect }: TrackRowProps) {
  return (
    <button
      type="button"
      aria-current={isCurrent}
      onClick={() => onSelect(index)}
      className="text-dim hover:text-paper hover:bg-hairline-soft focus-visible:text-paper focus-visible:bg-hairline-soft aria-[current=true]:text-paper aria-[current=true]:bg-hairline-soft aria-[current=true]:border-l-brass grid w-full grid-cols-[2.5em_minmax(0,1fr)_2.9em] items-center gap-sm border-l-2 border-l-transparent px-md py-sm text-left text-sm transition-colors duration-300 outline-none"
    >
      <span className={`font-label text-[10px] tracking-label tabular-nums ${isCurrent ? 'text-brass' : 'text-mute'}`}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="flex min-w-0 items-center gap-sm">
        {isCurrent ? (
          <LevelMeter />
        ) : (
          <span
            aria-hidden
            className="size-[4px] shrink-0 rounded-full"
            style={{ background: `hsl(${hueOf(track.genre)} 42% 56%)` }}
          />
        )}
        <span className="truncate">{track.title}</span>
      </span>
      <span className="font-label text-mute text-right text-[10px] tracking-label tabular-nums">
        {clock(track.durationMs)}
      </span>
    </button>
  );
}
