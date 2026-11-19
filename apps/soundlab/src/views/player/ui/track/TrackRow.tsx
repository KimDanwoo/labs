import type { Track } from '@entities/track';
import { GENRE_DOT_COLOR } from '../../config/display';
import { formatDurationMs, formatTrackNumber } from '../../lib/formatTrack';
import { hueOf } from '../../model/constants/genreHue';
import { LevelMeter } from './LevelMeter';

interface TrackRowProps {
  track: Track;
  index: number;
  position?: number;
  isCurrent: boolean;
  onSelect: (index: number) => void;
}

export function TrackRow({ track, index, position = index, isCurrent, onSelect }: TrackRowProps) {
  return (
    <button
      type="button"
      aria-current={isCurrent}
      onClick={() => onSelect(index)}
      className="text-dim hover:text-paper hover:bg-hairline-soft focus-visible:text-paper focus-visible:bg-hairline-soft aria-current:text-paper aria-current:bg-hairline-soft aria-current:border-l-brass grid w-full grid-cols-[2.5em_minmax(0,1fr)_2.9em] items-center gap-sm border-l-2 border-l-transparent px-md py-sm text-left text-sm transition-colors duration-300 outline-none"
    >
      <span className={`font-label text-[10px] tracking-label tabular-nums ${isCurrent ? 'text-brass' : 'text-mute'}`}>
        {formatTrackNumber(position)}
      </span>
      <span className="flex min-w-0 items-center gap-sm">
        {isCurrent ? (
          <LevelMeter />
        ) : (
          <span
            aria-hidden
            className="size-[4px] shrink-0 rounded-full"
            style={{
              background: `hsl(${hueOf(track.genre)} ${GENRE_DOT_COLOR.saturation} ${GENRE_DOT_COLOR.lightness})`,
            }}
          />
        )}
        <span className="truncate">{track.title}</span>
      </span>
      <span className="font-label text-mute text-right text-[10px] tracking-label tabular-nums">
        {formatDurationMs(track.durationMs)}
      </span>
    </button>
  );
}
