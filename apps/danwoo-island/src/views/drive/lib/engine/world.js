import './threejs-override.js'
import { DefaultLoadingManager } from 'three/webgpu'
import { worldAsset } from '../../config/worldAsset'
import { Game } from './Game/Game.js'

DefaultLoadingManager.setURLModifier(worldAsset)

export function startWorld()
{
    new Game()
}

export function isWorldDetached()
{
    const root = Game.getInstance()?.domElement
    return Boolean(root) && !root.isConnected
}
