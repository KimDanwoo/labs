import type { JSX, KeyboardEvent } from 'react';
import { useMusicPanel } from '../../model/hooks/music/useMusicPanel';
import { MusicPanelContext } from '../../model/store/musicPanelContext';
import { MusicCredit } from './MusicCredit';
import { MusicEngine } from './MusicEngine';
import { MusicError } from './MusicError';
import { MusicNow } from './MusicNow';
import { MusicPanelBody } from './MusicPanelBody';
import { MusicSeek } from './MusicSeek';
import { MusicToggle } from './MusicToggle';
import { MusicTrackList } from './MusicTrackList';

interface MusicPlayerProps {
  source: string;
  initialVolume: number;
  profile: string;
}

export function MusicPlayer({ source, initialVolume, profile }: MusicPlayerProps): JSX.Element {
  const panel = useMusicPanel(source, initialVolume, profile);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    event.stopPropagation();
    if (event.key !== 'Escape' || !panel.isExpanded) return;
    event.preventDefault();
    panel.collapse();
  };

  return (
    <MusicPanelContext.Provider value={panel}>
      <section
        className={`music-player ${panel.isExpanded ? 'is-expanded' : ''}`}
        aria-label="주머니 속 MP3"
        onKeyDown={handleKeyDown}
        onKeyUp={(event) => event.stopPropagation()}
      >
        <MusicToggle />
        <MusicPanelBody>
          <MusicNow />
          <MusicSeek />
          <MusicError />
          <MusicTrackList />
          <MusicCredit />
        </MusicPanelBody>
        <MusicEngine />
      </section>
    </MusicPanelContext.Provider>
  );
}
