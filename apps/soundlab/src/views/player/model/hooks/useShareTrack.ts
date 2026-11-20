import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';

import { TRACKS } from '@entities/track';
import { shareUrl } from '@views/player/lib/playerUrl';
import { currentIndexAtom, frameState } from '@views/player/model/store/playback';

import {
  ABORT_ERROR_NAME,
  SHARE_KIND,
  SHARE_NOTICE,
  SHARE_NOTICE_MS,
  SHARE_TITLE_SUFFIX,
  type ShareKind,
} from '@views/player/config/share';

export function useShareTrack() {
  const index = useAtomValue(currentIndexAtom);
  const track = TRACKS[index];
  const [notice, setNotice] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), SHARE_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const share = async (kind: ShareKind) => {
    if (!track) return;
    const ms = kind === SHARE_KIND.song ? 0 : frameState.position * frameState.durationMs;
    const url = shareUrl(track, ms, window.location.origin);
    setFallbackUrl('');
    try {
      if (kind === SHARE_KIND.native && typeof navigator.share === 'function') {
        await navigator.share({ title: `${track.title}${SHARE_TITLE_SUFFIX}`, text: track.title, url });
        setNotice('공유했습니다.');
        return;
      }
      await navigator.clipboard.writeText(url);
      setNotice(SHARE_NOTICE[kind]);
    } catch (error) {
      if (error instanceof DOMException && error.name === ABORT_ERROR_NAME) return;
      setFallbackUrl(url);
      setNotice('아래 링크를 직접 복사하세요.');
    }
  };

  return { notice, fallbackUrl, share, clearFallback: () => setFallbackUrl('') };
}
