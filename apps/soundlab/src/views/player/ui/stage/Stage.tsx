'use client';

import { artworkUrl, TRACKS } from '@entities/track';
import { ARTWORK_TEXTURE_SIZE } from '@views/player/config/stage';
import { formatTrackNumber } from '@views/player/lib/formatTrack';
import { currentIndexAtom } from '@views/player/model/store/playback';
import { VISUAL_MODE, visualModeAtom } from '@views/player/model/visual';
import { FavoriteButton } from '@views/player/ui/library/FavoriteButton';
import { ParticleCanvas } from '@views/player/ui/stage/ParticleCanvas';
import { PlaybackStatus } from '@views/player/ui/stage/PlaybackStatus';
import { TrackDetails } from '@views/player/ui/stage/TrackDetails';
import { VisualSettings } from '@views/player/ui/stage/VisualSettings';
import { useAtomValue } from 'jotai';
import { useCallback, useRef, useState } from 'react';

export function Stage() {
  const index = useAtomValue(currentIndexAtom);
  const visualMode = useAtomValue(visualModeAtom);
  const isStill = visualMode === VISUAL_MODE.still;
  const slot = useRef<HTMLDivElement | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const track = TRACKS[index];

  const handleReady = useCallback((ready: boolean) => setCanvasReady(ready), []);

  const isPosterShown = track && (!canvasReady || isStill);
  return (
    <section className="stage order-1 relative flex min-h-0 flex-col items-center justify-center gap-md overflow-y-auto p-md pt-3xl min-[820px]:order-2">
      <div className="stage-caption absolute top-md inset-x-md flex justify-between font-label text-xs text-mute">
        <span>현재 곡</span>
        <span>
          {formatTrackNumber(index)} / {TRACKS.length}
        </span>
      </div>
      {!isStill ? <ParticleCanvas slotRef={slot} onReady={handleReady} /> : null}
      <div ref={slot} className="aspect-square w-[min(84%,46dvh)] shrink-0 min-[820px]:w-[min(64%,58vh)]">
        {isPosterShown ? (
          <img
            src={artworkUrl(track, ARTWORK_TEXTURE_SIZE)}
            alt=""
            className="size-full object-cover"
            draggable={false}
          />
        ) : null}
      </div>
      <div className="flex max-w-[34ch] flex-col items-center gap-xs text-center">
        <h2 className="text-[clamp(22px,2.7vw,38px)] leading-tight font-bold tracking-tight break-keep text-balance">
          {track?.title ?? ''}
        </h2>
        <span className="font-label text-mute text-[10px] tracking-wide-label uppercase">{track?.genre ?? ''}</span>
        <div className="flex flex-wrap items-center justify-center gap-xs">
          {track ? <FavoriteButton trackId={track.id} title={track.title} /> : null}
          <TrackDetails />
          <VisualSettings />
        </div>
        <PlaybackStatus />
      </div>
    </section>
  );
}
