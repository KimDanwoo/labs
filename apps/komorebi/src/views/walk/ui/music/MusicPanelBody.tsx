import type { ReactNode } from 'react';
import { useMusicPanelContext } from '../../model/hooks/music/useMusicPanelContext';

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
