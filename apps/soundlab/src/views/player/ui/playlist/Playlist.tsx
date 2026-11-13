'use client';

import { currentIndexAtom, playbackQueueAtom, TRACKS, usePlaybackControls } from '@entities/track';
import { Button, ScrollArea } from '@ui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, type JSX } from 'react';
import { COLLECTIONS } from '../../config/collections';
import {
  collectionFilterAtom,
  FILTER_LABELS,
  libraryFilterAtom,
  searchAtom,
  visibleTracksAtom,
} from '../../model/browse';
import { BrowseControls } from '../library/BrowseControls';
import { CollectionCard } from '../library/CollectionCard';
import { LibraryTrack } from '../library/LibraryTrack';
import { ListeningHistory } from '../library/ListeningHistory';

export function Playlist(): JSX.Element {
  const index = useAtomValue(currentIndexAtom);
  const tracks = useAtomValue(visibleTracksAtom);
  const filter = useAtomValue(libraryFilterAtom);
  const selectedCollection = useAtomValue(collectionFilterAtom);
  const queue = useAtomValue(playbackQueueAtom);
  const setSearch = useSetAtom(searchAtom);
  const { startQueue } = usePlaybackControls();
  const list = useRef<HTMLDivElement | null>(null);
  const collection = COLLECTIONS.find((item) => item.id === selectedCollection);
  const label = collection?.title ?? FILTER_LABELS[filter];
  const availableCount = TRACKS.filter((track) => track.isAvailable !== false).length;
  useEffect(() => {
    list.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [index]);
  return (
    <aside
      id="playlist"
      aria-label="음악 라이브러리"
      className="absolute inset-x-0 top-0 bottom-0 z-20 order-2 row-start-2 row-end-3 flex min-h-0 flex-col border-hairline bg-void player:static player:order-1 player:row-auto player:border-r"
    >
      <div className="border-b border-hairline p-md pr-3xl">
        <h1 className="font-label text-sm tracking-mark text-paper">SOUNDLAB</h1>
        <p className="mt-xs text-xs text-dim">{availableCount}곡</p>
      </div>
      <ScrollArea ref={list} className="min-h-0 flex-1">
        <div className="space-y-md p-md">
          <details>
            <summary className="cursor-pointer text-xs text-dim">플레이리스트</summary>
            <div className="mt-md flex flex-col">
              {COLLECTIONS.map((item) => (
                <CollectionCard key={item.id} collection={item} />
              ))}
            </div>
          </details>
          <BrowseControls />
          {queue ? (
            <p className="text-xs text-brass" role="status">
              재생 중인 순서 · {queue.label} · {queue.ids.length}곡
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-sm">
            <p className="text-sm" aria-live="polite">
              {label} · {tracks.length}곡
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!tracks.length}
              onClick={() => startQueue({ ids: tracks.map((track) => track.id), label })}
            >
              이 목록 재생
            </Button>
          </div>
        </div>
        {tracks.length ? (
          tracks.map((track, position) => <LibraryTrack key={track.id} track={track} position={position} />)
        ) : (
          <div className="p-lg text-center text-sm leading-relaxed text-dim">
            <p>표시할 곡이 없습니다.</p>
            <Button type="button" variant="ghost" className="mt-sm" onClick={() => setSearch('')}>
              검색어 지우기
            </Button>
          </div>
        )}
        <ListeningHistory />
      </ScrollArea>
    </aside>
  );
}
