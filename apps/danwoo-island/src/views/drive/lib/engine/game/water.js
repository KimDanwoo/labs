import { uniform } from 'three/tsl'
import { getGame } from './gameContext'

export class Water
{
    constructor()
    {
        this.game = getGame()

        this.surfaceElevation = -0.3
        this.depthElevation = -1.5

        this.surfaceElevationUniform = uniform(this.surfaceElevation)
        this.surfaceThicknessUniform = uniform(0.013)
    }
}