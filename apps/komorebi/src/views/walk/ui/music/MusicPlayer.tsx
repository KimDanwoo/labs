import { useMusicPanel } from '@views/walk/model/hooks/music/useMusicPanel';
import { MusicPanelContext } from '@views/walk/model/store/musicPanelContext';
import { MusicCredit } from '@views/walk/ui/music/MusicCredit';
import { MusicEngine } from '@views/walk/ui/music/MusicEngine';
import { MusicError } from '@views/walk/ui/music/MusicError';
import { MusicNow } from '@views/walk/ui/music/MusicNow';
import { MusicPanelBody } from '@views/walk/ui/music/MusicPanelBody';
import { MusicSeek } from '@views/walk/ui/music/MusicSeek';
import { MusicToggle } from '@views/walk/ui/music/MusicToggle';
import { MusicTrackList } from '@views/walk/ui/music/MusicTrackList';
import type { JSX, KeyboardEvent } from 'react';

interface MusicPlayerProps {
  source: string;
  initialVolume: number;
  profile: string;
}

export function MusicPlayer({ source, initialVolume, profile }: MusicPlayerProps): JSX.Element {
  const panel = useMusicPanel(source, initialVolume, profile);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    event.stopPropagation();
    if (event.key !== 'Escape') return;
    if (!panel.isExpanded) return;
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
