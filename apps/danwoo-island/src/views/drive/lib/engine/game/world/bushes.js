import * as THREE from 'three/webgpu'
import { color, uniform } from 'three/tsl'
import { Foliage } from './foliage'
import { Game } from '../game'

export class Bushes
{
    constructor()
    {
        this.game = Game.getInstance()

        this.colorANode = uniform(color('#438a50'))
        this.colorBNode = uniform(color('#91c85c'))
        this.foliage = new Foliage(this.game.resources.bushesReferences.scene.children, this.colorANode, this.colorBNode)

        // Debug
    }
}