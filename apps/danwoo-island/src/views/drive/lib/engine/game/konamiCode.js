import { modelResource } from './resourcesLoader'
import * as THREE from 'three/webgpu'
import { getGame } from './gameContext'
import { VisualVehicle } from './world/visualVehicle'

export class KonamiCode
{
    constructor(once = false)
    {
        this.game = getGame()

        let index = 0
        this.activationCount = 0
        const sequence = [
            [ 'ArrowUp', 'KeyW' ],
            [ 'ArrowUp', 'KeyW' ],
            [ 'ArrowDown', 'KeyS' ],
            [ 'ArrowDown', 'KeyS' ],
            [ 'ArrowLeft', 'KeyA' ],
            [ 'ArrowRight', 'KeyD' ],
            [ 'ArrowLeft', 'KeyA' ],
            [ 'ArrowRight', 'KeyD' ],
            [ 'KeyB' ],
            [ 'KeyQ', 'KeyA' ],
        ]

        const callback = (event) =>
        {
            const sequenceItem = sequence[index]

            if(sequenceItem.indexOf(event.code) !== -1)
            {
                index++

                if(index === sequence.length)
                {
                    this.activate()

                    if(once)
                        document.removeEventListener('keydown', callback)

                    index = 0
                }
            }
            else
            {
                index = 0
            }
        }
        document.addEventListener('keydown', callback)
    }

    async activate()
    {
        const files = [
            'vehicle/oldSchool.glb',
            'vehicle/default.glb'
        ]

        const resources = await this.game.resourcesLoader.load([
            modelResource('vehicle', `${files[this.activationCount % 2]}?cb=${this.activationCount}`),
        ])

        this.game.world.visualVehicle.destroy()
        this.game.world.visualVehicle = new VisualVehicle(resources.vehicle.scene)

        if(this.game.world.confetti)
        {
            this.game.world.confetti.pop(this.game.player.position.clone())
            this.game.world.confetti.pop(this.game.player.position.clone().add(new THREE.Vector3(1, -1, 1.5)))
            this.game.world.confetti.pop(this.game.player.position.clone().add(new THREE.Vector3(1, -1, -1.5)))
        }

        this.activationCount++
    }
}
