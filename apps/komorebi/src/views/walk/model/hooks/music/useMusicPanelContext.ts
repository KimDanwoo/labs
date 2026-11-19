'use client';

import { useContext } from 'react';
import { MusicPanelContext } from '../../store/musicPanelContext';
import type { MusicPanel } from './useMusicPanel';

export function useMusicPanelContext(): MusicPanel {
  const panel = useContext(MusicPanelContext);
  if (!panel) throw new Error('MusicPlayer 안에서만 사용할 수 있습니다');
  return panel;
}
