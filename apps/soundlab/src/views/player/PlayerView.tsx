'use client';

import { PLAYER_SCREEN, type PlayerScreen } from '@entities/track/model/constants/playerScreen';
import { TRACKS } from '@entities/track/model/constants/tracks';
import { useKeyboard } from '@entities/track/model/hooks/useKeyboard';
import { useMediaSession } from '@entities/track/model/hooks/useMediaSession';
import { usePlayback } from '@entities/track/model/hooks/usePlayback';
import { PlaybackProvider } from '@entities/track/model/hooks/usePlaybackControls';
import { useTrackUrl } from '@entities/track/model/hooks/useTrackUrl';
import { useWaveform } from '@entities/track/model/hooks/useWaveform';
import { currentIndexAtom, engineModeAtom, isPlayingAtom, playerScreenAtom } from '@entities/track/model/store';
import { Playlist, QueueToggle } from '@widgets/playlist/ui';
import { Stage } from '@widgets/stage/ui';
import { ShareButton, Transport } from '@widgets/transport/ui';
import { useAtomValue } from 'jotai';

type PlayerViewProps = {
  /** 공유 링크(/t/[id])로 들어왔을 때 시작할 곡. 없으면 첫 곡. */
  initialTrackId?: number;
  /** 진입 화면. /t/[id]/queue로 들어오면 재생목록부터 보여준다. */
  initialScreen?: PlayerScreen;
};

export function PlayerView({ initialTrackId, initialScreen }: PlayerViewProps) {
  useTrackUrl(TRACKS, initialTrackId, initialScreen);

  const index = useAtomValue(currentIndexAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const engineMode = useAtomValue(engineModeAtom);
  const screen = useAtomValue(playerScreenAtom);

  const playback = usePlayback(TRACKS, initialTrackId);
  useWaveform(TRACKS[index], TRACKS[(index + 1) % TRACKS.length], isPlaying);
  useKeyboard(playback);
  useMediaSession(TRACKS[index], isPlaying, playback);

  const isQueue = screen === PLAYER_SCREEN.queue;

  return (
    <PlaybackProvider value={playback}>
      {/* 화면은 무대와 재생목록 둘이고, 재생바는 둘 다에 남는다 — 목록에서도 조작할 수 있어야 한다.
          모바일은 목록이 무대를 덮고, 데스크톱은 왼쪽 열로 붙는다(그래서 열 구성만 달라진다).
          order는 셋 다 명시한다 — 빠뜨리면 기본값 0이 되어 자동 배치에서 맨 위로 올라간다. */}
      <div
        data-engine-mode={engineMode}
        className={`relative z-10 grid h-full grid-cols-1 grid-rows-[minmax(0,1fr)_auto] ${
          isQueue
            ? 'min-[820px]:grid-cols-[clamp(258px,25vw,372px)_minmax(0,1fr)]'
            : 'min-[820px]:grid-cols-[minmax(0,1fr)]'
        }`}
      >
        {isQueue ? <Playlist /> : null}
        <Stage />
        <Transport />
        <div className="absolute top-md right-md z-20 flex items-center gap-xs">
          <ShareButton />
          <QueueToggle />
        </div>
      </div>
    </PlaybackProvider>
  );
}
