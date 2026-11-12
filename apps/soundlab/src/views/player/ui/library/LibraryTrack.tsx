import { currentIndexAtom, TrackRow, TRACKS, usePlaybackControls, type Track } from '@entities/track';
import { useAtomValue } from 'jotai';
import type { JSX } from 'react';
import { FavoriteButton } from './FavoriteButton';

type Props = { track: Track; position: number };
export function LibraryTrack({ track, position }: Props): JSX.Element {
  const index = useAtomValue(currentIndexAtom);
  const { select } = usePlaybackControls();
  const trackIndex = TRACKS.findIndex((item) => item.id === track.id);
  return (
    <div className="flex items-center pr-xs">
      <div className="min-w-0 flex-1">
        <TrackRow
          track={track}
          index={trackIndex}
          position={position}
          isCurrent={index === trackIndex}
          onSelect={select}
        />
      </div>
      <FavoriteButton trackId={track.id} title={track.title} />
    </div>
  );
}
