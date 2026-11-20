import { TRACKS, type Track } from '@entities/track';
import { useAtomValue } from 'jotai';
import type { JSX } from 'react';
import { currentIndexAtom } from '../../model/store/playback';
import { TrackRow } from '../track/TrackRow';
import { FavoriteButton } from './FavoriteButton';

type Props = { track: Track; position: number };
export function LibraryTrack({ track, position }: Props): JSX.Element {
  const index = useAtomValue(currentIndexAtom);
  const trackIndex = TRACKS.findIndex((item) => item.id === track.id);
  return (
    <div className="flex items-center pr-xs">
      <div className="min-w-0 flex-1">
        <TrackRow track={track} index={trackIndex} position={position} isCurrent={index === trackIndex} />
      </div>
      <FavoriteButton trackId={track.id} title={track.title} />
    </div>
  );
}
