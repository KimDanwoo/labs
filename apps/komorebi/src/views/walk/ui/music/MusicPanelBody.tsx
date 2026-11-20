import { useMusicPanelContext } from '@views/walk/model/hooks/music/useMusicPanelContext';
import type { ReactNode } from 'react';

interface MusicPanelBodyProps {
  children: ReactNode;
}

export function MusicPanelBody({ children }: MusicPanelBodyProps) {
  const { isExpanded } = useMusicPanelContext();
  return (
    <div id="music-panel" className="music-panel" hidden={!isExpanded}>
      {children}
    </div>
  );
}
