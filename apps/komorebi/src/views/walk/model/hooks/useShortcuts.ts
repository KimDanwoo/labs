import { gameKey, hasShortcutModifier, isControlTarget } from '@views/walk/lib/input';
import { useEffect, useEffectEvent } from 'react';

type Shortcuts = { isEnabled: boolean; onDiscover: () => void; onOpenMap: () => void };

export function useShortcuts({ isEnabled, onDiscover, onOpenMap }: Shortcuts) {
  const handleKey = useEffectEvent((event: KeyboardEvent) => {
    const isOnControl = event.target instanceof HTMLElement && isControlTarget(event.target);
    if (!isEnabled) return;
    if (event.repeat) return;
    if (isOnControl) return;
    if (hasShortcutModifier(event)) return;
    const key = gameKey(event);
    if (key === 'e') onDiscover();
    if (key === 'm') onOpenMap();
  });
  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);
}
