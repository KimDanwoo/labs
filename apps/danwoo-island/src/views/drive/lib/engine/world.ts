import './objectCopyOverride';

import { DefaultLoadingManager } from 'three/webgpu';

import { worldAsset } from '../../config/worldAsset';
import { Game } from './game/game';
import { peekGame } from './game/gameContext';

DefaultLoadingManager.setURLModifier(worldAsset);

export function startWorld(): void {
  if (peekGame()) return;
  new Game();
}

export function isWorldDetached(): boolean {
  const root = peekGame()?.domElement;
  return Boolean(root) && !root?.isConnected;
}
