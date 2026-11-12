import { currentIndexAtom, HIGHLIGHTS, TRACKS, usePlaybackControls } from '@entities/track';
import { Button, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@ui/react';
import { useAtomValue } from 'jotai';
import type { JSX } from 'react';
import { collectionsForTrack } from '../../config/collections';

export function TrackDetails(): JSX.Element | null {
  const index = useAtomValue(currentIndexAtom);
  const track = TRACKS[index];
  const { playFrom } = usePlaybackControls();
  if (!track) return null;
  const collections = collectionsForTrack(track.id);
  const highlightMs = HIGHLIGHTS[track.id];
  const highlightLabel =
    highlightMs === undefined
      ? null
      : `${Math.floor(highlightMs / 60_000)}:${String(Math.floor(highlightMs / 1000) % 60).padStart(2, '0')}`;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="text-dim">
          곡 정보
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto border-hairline bg-void text-paper">
        <SheetHeader>
          <SheetTitle className="text-xl text-paper">{track.title}</SheetTitle>
          <SheetDescription className="text-dim">DANWOO · {track.genre}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-lg px-md pb-lg">
          {track.description ? (
            <div>
              <h3 className="mb-sm font-semibold">곡 설명</h3>
              <p className="text-sm leading-relaxed whitespace-pre-line text-dim">{track.description}</p>
              <p className="mt-sm text-xs text-mute">출처: SoundCloud</p>
            </div>
          ) : null}
          {highlightLabel !== null && track.isAvailable !== false ? (
            <div className="rounded-md border border-hairline p-md">
              <h3 className="font-semibold">분석 구간</h3>
              <p className="mt-xs text-sm leading-relaxed text-dim">음원 분석으로 찾은 에너지가 높은 구간입니다.</p>
              <Button type="button" variant="outline" className="mt-md" onClick={() => playFrom(highlightMs ?? 0)}>
                {highlightLabel}부터 재생
              </Button>
            </div>
          ) : null}
          {collections.length ? (
            <div>
              <h3 className="mb-sm font-semibold">포함된 플레이리스트</h3>
              {collections.map((collection) => (
                <p key={collection.id} className="mb-sm text-sm leading-relaxed text-dim">
                  {collection.title}
                </p>
              ))}
            </div>
          ) : null}
          <a
            href={track.permalinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brass underline underline-offset-4"
          >
            SoundCloud에서 곡 보기 ↗
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
