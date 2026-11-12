'use client';

import { useAtomValue } from 'jotai';
import type { JSX } from 'react';
import { visibleTracksAtom } from '../../model/browse';
import { BrowseControls } from '../library/BrowseControls';
import { ArchiveRecord } from './ArchiveRecord';

export function Archive(): JSX.Element {
  const tracks = useAtomValue(visibleTracksAtom);
  return (
    <main className="archive-scroll min-h-0 overflow-y-auto" aria-label="음악 아카이브">
      <div className="archive-content mx-auto px-md pb-3xl player:px-xl">
        <header className="flex items-end justify-between gap-md border-b border-hairline py-lg">
          <h1 className="text-3xl font-semibold tracking-tight">DANWOO</h1>
          <span className="text-sm text-dim">음악</span>
        </header>
        <div className="archive-tools border-b border-hairline py-md">
          <BrowseControls />
        </div>
        <div className="flex items-center justify-between pt-lg pb-md font-label text-xs text-dim">
          <h2>곡 목록</h2>
          <span aria-live="polite">{tracks.length}곡</span>
        </div>
        {tracks.length ? (
          <div className="record-grid">
            {tracks.map((track, position) => (
              <ArchiveRecord key={track.id} track={track} position={position} />
            ))}
          </div>
        ) : (
          <p className="py-3xl text-sm text-dim">표시할 곡이 없습니다. 검색어나 필터를 바꿔보세요.</p>
        )}
        <footer className="mt-3xl flex flex-wrap justify-between gap-md border-t border-hairline pt-lg font-label text-xs text-mute">
          <span>DANWOO</span>
          <a
            href="https://soundcloud.com/danwooking"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-paper"
          >
            SOUNDCLOUD ↗
          </a>
        </footer>
      </div>
    </main>
  );
}
