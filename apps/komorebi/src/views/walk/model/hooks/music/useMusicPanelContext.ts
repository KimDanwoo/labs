'use client';

import type { MusicPanel } from '@views/walk/model/hooks/music/useMusicPanel';
import { MusicPanelContext } from '@views/walk/model/store/musicPanelContext';
import { useContext } from 'react';

export function useMusicPanelContext(): MusicPanel {
  const panel = useContext(MusicPanelContext);
  if (!panel) throw new Error('MusicPlayer 안에서만 사용할 수 있습니다');
  return panel;
}
