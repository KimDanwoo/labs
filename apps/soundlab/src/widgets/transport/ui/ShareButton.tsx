'use client';

import { TRACKS } from '@entities/track/model/constants/tracks';
import { trackPath } from '@entities/track/model/services';
import { currentIndexAtom } from '@entities/track/model/store';
import { FLOATING_BUTTON } from '@shared/lib/floatingButton';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { CheckIcon, LinkIcon } from './icons';

const COPIED_MS = 1600;

// 보조 동작이라 목록 버튼보다 한 단계 가라앉힌다. 복사 완료는 aria-pressed에 묶는다.
const SHARE_BUTTON = [
  FLOATING_BUTTON,
  'bg-void/60 text-dim hover:text-paper hover:bg-void/85 focus-visible:text-paper focus-visible:bg-void/85',
  'aria-[pressed=true]:text-brass aria-[pressed=true]:hover:text-brass',
].join(' ');

export function ShareButton() {
  const index = useAtomValue(currentIndexAtom);
  const [isCopied, setIsCopied] = useState(false);
  const track = TRACKS[index];

  useEffect(() => {
    if (!isCopied) return undefined;
    const timer = setTimeout(() => setIsCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [isCopied]);

  const handleClick = async () => {
    if (!track) return;
    // clipboard는 비보안 컨텍스트나 권한 거부로 실패할 수 있다. 실패를 삼키지 않고 표시를 안 바꾼다.
    try {
      await navigator.clipboard.writeText(new URL(trackPath(track), window.location.origin).toString());
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  };

  return (
    <button
      type="button"
      aria-label={isCopied ? '링크 복사됨' : '이 곡 링크 복사'}
      title={isCopied ? '복사됨' : '이 곡 링크 복사'}
      aria-pressed={isCopied}
      className={SHARE_BUTTON}
      onClick={handleClick}
    >
      {isCopied ? <CheckIcon /> : <LinkIcon />}
    </button>
  );
}
