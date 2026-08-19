'use client';

import { TRACKS } from '@entities/track/model/constants/tracks';
import { useKeyboard } from '@entities/track/model/hooks/useKeyboard';
import { usePlayback } from '@entities/track/model/hooks/usePlayback';
import { PlaybackProvider } from '@entities/track/model/hooks/usePlaybackControls';
import { useWaveform } from '@entities/track/model/hooks/useWaveform';
import { currentIndexAtom, engineModeAtom, isPlayingAtom } from '@entities/track/model/store';
import { Playlist } from '@widgets/playlist/ui';
import { Stage } from '@widgets/stage/ui';
import { Transport } from '@widgets/transport/ui';
import { useAtomValue } from 'jotai';

export function PlayerView() {
  const index = useAtomValue(currentIndexAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const engineMode = useAtomValue(engineModeAtom);

  const playback = usePlayback(TRACKS);
  useWaveform(TRACKS[index], isPlaying);
  useKeyboard(playback);

  return (
    <PlaybackProvider value={playback}>
      {/* 모바일: 아트워크 → 목록 → transport. order를 셋 다 명시한다 —
          빠뜨리면 기본값 0이 되어 자동 배치에서 맨 위로 올라간다. */}
      <div
        data-engine-mode={engineMode}
        className="relative z-10 grid h-full grid-cols-1 grid-rows-[minmax(0,1fr)_38vh_auto] min-[820px]:grid-cols-[clamp(258px,25vw,372px)_minmax(0,1fr)] min-[820px]:grid-rows-[minmax(0,1fr)_auto]"
      >
        <Playlist />
        <Stage />
        <Transport />
      </div>
    </PlaybackProvider>
  );
}
