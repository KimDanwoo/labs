import { useEffect, useEffectEvent } from 'react';
import { gameKey, isControlTarget } from '@features/walk/lib/input';

type Shortcuts = { isEnabled: boolean; onDiscover: () => void; onOpenMap: () => void };

export function useShortcuts({ isEnabled, onDiscover, onOpenMap }: Shortcuts) {
  const handleKey = useEffectEvent((event: KeyboardEvent) => {
    const isOnControl = event.target instanceof HTMLElement && isControlTarget(event.target);
    if (!isEnabled || event.repeat || isOnControl) return;
    const key = gameKey(event);
    if (key === 'e') onDiscover();
    if (key === 'm') onOpenMap();
  });
  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);
}
