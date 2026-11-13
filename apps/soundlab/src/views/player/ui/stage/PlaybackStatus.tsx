import {
  currentIndexAtom,
  engineErrorAtom,
  isReadyAtom,
  recoveryNoticeAtom,
  resumeNoticeAtom,
  TRACKS,
  usePlaybackControls,
} from '@entities/track';
import { Button } from '@ui/react';
import { useAtomValue } from 'jotai';
import type { JSX } from 'react';

export function PlaybackStatus(): JSX.Element | null {
  const error = useAtomValue(engineErrorAtom);
  const isReady = useAtomValue(isReadyAtom);
  const hasRecovered = useAtomValue(recoveryNoticeAtom);
  const resumeMs = useAtomValue(resumeNoticeAtom);
  const index = useAtomValue(currentIndexAtom);
  const track = TRACKS[index];
  const { retry, playFrom } = usePlaybackControls();
  if (track?.isAvailable === false)
    return (
      <p role="status" className="max-w-prose text-sm text-dim">
        현재 비공개인 곡입니다.
      </p>
    );
  if (error)
    return (
      <div className="max-w-prose text-sm">
        <p role="alert" className="text-error">
          {error}
        </p>
        <Button type="button" variant="outline" className="mt-sm" onClick={retry}>
          다시 연결
        </Button>
      </div>
    );
  if (!isReady)
    return (
      <p role="status" className="text-xs text-dim">
        재생 준비 중
      </p>
    );
  if (hasRecovered)
    return (
      <p role="status" className="text-xs text-dim">
        연결됐습니다. 재생 버튼을 눌러주세요.
      </p>
    );
  if (resumeMs !== null && resumeMs > 0)
    return (
      <div className="flex flex-wrap items-center justify-center gap-xs text-xs text-dim">
        <span>
          {Math.floor(resumeMs / 60_000)}:{String(Math.floor(resumeMs / 1000) % 60).padStart(2, '0')}부터 이어듣기
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={() => playFrom(0)}>
          처음부터
        </Button>
      </div>
    );
  return null;
}
