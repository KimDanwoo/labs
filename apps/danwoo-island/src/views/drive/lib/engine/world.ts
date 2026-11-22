import '@views/drive/lib/engine/objectCopyOverride';

import { DefaultLoadingManager } from 'three/webgpu';

import { worldAsset } from '@views/drive/config/worldAsset';
import { Game } from '@views/drive/lib/engine/game/game';
import { peekGame } from '@views/drive/lib/engine/game/gameContext';

DefaultLoadingManager.setURLModifier(worldAsset);

export function startWorld(): void {
  if (peekGame()) return;
  const root = document.documentElement;
  const hasOrphanedWorld = root.dataset.worldStarted !== undefined;
  if (hasOrphanedWorld) return;
  root.dataset.worldStarted = '';
  new Game();
}

export function isWorldDetached(): boolean {
  const root = peekGame()?.domElement;
  return Boolean(root) && !root?.isConnected;
}
