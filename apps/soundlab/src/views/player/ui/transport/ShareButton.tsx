'use client';

import { currentIndexAtom, frameState, shareUrl, TRACKS } from '@entities/track';
import { FLOATING_BUTTON } from '@shared/lib/floatingButton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ui/react';
import { useAtomValue } from 'jotai';
import { useEffect, useState, type JSX } from 'react';
import { LinkIcon } from './LinkIcon';

const SHARE_KIND = { song: 'song', moment: 'moment', native: 'native' } as const;
type ShareKind = (typeof SHARE_KIND)[keyof typeof SHARE_KIND];
const NOTICE_MS = 5000;

export function ShareButton(): JSX.Element {
  const index = useAtomValue(currentIndexAtom);
  const track = TRACKS[index];
  const [notice, setNotice] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);
  const handleShare = async (kind: ShareKind) => {
    if (!track) return;
    const ms = kind === SHARE_KIND.song ? 0 : frameState.position * frameState.durationMs;
    const url = shareUrl(track, ms, window.location.origin);
    setFallbackUrl('');
    try {
      if (kind === SHARE_KIND.native && typeof navigator.share === 'function') {
        await navigator.share({ title: `${track.title} — DANWOO`, text: track.title, url });
        setNotice('공유했습니다.');
        return;
      }
      await navigator.clipboard.writeText(url);
      setNotice(kind === SHARE_KIND.song ? '링크를 복사했습니다.' : '현재 위치 링크를 복사했습니다.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setFallbackUrl(url);
      setNotice('아래 링크를 직접 복사하세요.');
    }
  };
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="곡 공유"
            title="곡 공유"
            className={`${FLOATING_BUTTON} bg-void/80 text-dim hover:text-paper`}
          >
            <LinkIcon />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="border-hairline bg-void text-paper">
          <DropdownMenuItem onSelect={() => void handleShare(SHARE_KIND.song)}>곡 링크 복사</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void handleShare(SHARE_KIND.moment)}>현재 위치 링크 복사</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void handleShare(SHARE_KIND.native)}>다른 앱으로 공유</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {notice || fallbackUrl ? (
        <div className="absolute top-full right-0 mt-sm w-64 rounded-md border border-hairline bg-void p-md text-sm text-paper">
          <p role="status">{notice}</p>
          {fallbackUrl ? (
            <>
              <input
                aria-label="직접 복사할 공유 링크"
                readOnly
                value={fallbackUrl}
                onFocus={(event) => event.currentTarget.select()}
                className="mt-sm w-full rounded-sm border border-hairline bg-void p-xs text-xs"
              />
              <button type="button" onClick={() => setFallbackUrl('')} className="mt-sm text-brass">
                닫기
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
