import { useAtom, useAtomValue } from 'jotai';

import { TRACKS } from '@entities/track';
import { REPEAT_LABEL, REPEAT_MODE, nextRepeatMode } from '@views/player/model/constants/repeatMode';
import { usePlaybackControls } from '@views/player/model/hooks/usePlaybackControls';
import { currentIndexAtom, isPlayingAtom, repeatModeAtom, shuffleAtom } from '@views/player/model/store/playback';

import { TRACK_STEP } from '@views/player/config/layout';
import { NextIcon } from '@views/player/ui/transport/NextIcon';
import { PauseIcon } from '@views/player/ui/transport/PauseIcon';
import { PlayIcon } from '@views/player/ui/transport/PlayIcon';
import { PrevIcon } from '@views/player/ui/transport/PrevIcon';
import { RepeatIcon } from '@views/player/ui/transport/RepeatIcon';
import { RepeatOneIcon } from '@views/player/ui/transport/RepeatOneIcon';
import { ShuffleIcon } from '@views/player/ui/transport/ShuffleIcon';
import { TransportIconButton } from '@views/player/ui/transport/TransportIconButton';

export function PlaybackButtons() {
  const { toggle, step } = usePlaybackControls();
  const isPlaying = useAtomValue(isPlayingAtom);
  const track = TRACKS[useAtomValue(currentIndexAtom)];
  const [shuffle, setShuffle] = useAtom(shuffleAtom);
  const [repeatMode, setRepeatMode] = useAtom(repeatModeAtom);
  const shuffleLabel = `임의재생 ${shuffle ? '켬' : '끔'}`;
  const playLabel = isPlaying ? '일시정지' : '재생';

  return (
    <div className="col-start-1 col-end-3 row-start-2 flex items-center justify-center gap-xs min-[820px]:col-start-2 min-[820px]:row-start-1">
      <TransportIconButton
        aria-pressed={shuffle}
        aria-label={shuffleLabel}
        title={shuffleLabel}
        onClick={() => setShuffle((value) => !value)}
      >
        <ShuffleIcon />
      </TransportIconButton>
      <TransportIconButton aria-label="이전 곡" title="이전 곡 · Shift+P" onClick={() => step(TRACK_STEP.previous)}>
        <PrevIcon />
      </TransportIconButton>
      <button
        type="button"
        disabled={track?.isAvailable === false}
        aria-label={playLabel}
        title={`${playLabel} · Space / K`}
        className="text-void bg-paper grid size-[54px] place-items-center rounded-full outline-none transition-[background-color,transform] duration-150 active:scale-90 hover:bg-white focus-visible:bg-white"
        onClick={toggle}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <TransportIconButton aria-label="다음 곡" title="다음 곡 · Shift+N" onClick={() => step(TRACK_STEP.next)}>
        <NextIcon />
      </TransportIconButton>
      <TransportIconButton
        aria-pressed={repeatMode !== REPEAT_MODE.off}
        aria-label={`반복: ${REPEAT_LABEL[repeatMode]}`}
        title={`${REPEAT_LABEL[repeatMode]} · 눌러서 전환`}
        onClick={() => setRepeatMode(nextRepeatMode)}
      >
        {repeatMode === REPEAT_MODE.one ? <RepeatOneIcon /> : <RepeatIcon />}
      </TransportIconButton>
    </div>
  );
}
