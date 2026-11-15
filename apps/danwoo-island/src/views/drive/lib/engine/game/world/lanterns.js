import { getGame } from '../gameContext'
import { InstancedGroup } from '../instancedGroup'
import { createGardenLamp } from './islandProps'

export class Lanterns
{
    constructor()
    {
        this.game = getGame()

        const [ base, references ] = InstancedGroup.getBaseAndReferencesFromInstances(this.game.resources.lanternsModel.scene.children)

        for(const child of base.children)
        {
            child.name = child.name.replace(/[0-9]+$/i, '')
            child.castShadow = true
            child.receiveShadow = true
            child.frustumCulled = false
        }

        this.game.materials.updateObject(base)

        this.objects = []
        for(const reference of references)
        {
            this.objects.push(
                this.game.objects.add(
                    {
                        model: reference,
                        updateMaterials: false,
                        castShadow: false,
                        receiveShadow: false,
                        parent: null,
                    },
                    {
                        type: 'dynamic',
                        position: reference.position,
                        rotation: reference.quaternion,
                        friction: 0.7,
                        mass: 0.1,
                        sleeping: true,
                        colliders: [ { shape: 'cuboid', parameters: [ 0.7 * 0.5, 1 * 0.5, 0.7 * 0.5 ], category: 'object' } ],
                        waterGravityMultiplier: - 1,
                        contactThreshold: 10,
                        onCollision: (force, position) =>
                        {
                            this.game.audio.groups.get('hitBrick').playRandomNext(force, position)
                        }
                    },
                )
            )
        }

        this.instancedGroup = new InstancedGroup(references, createGardenLamp(this.game.materials))

        this.game.ticker.events.on('tick', () =>
        {
            for(const object of this.objects)
            {
                if(!object.physical.body.isSleeping() && object.physical.body.isEnabled())
                    object.visual.object3D.needsUpdate = true
            }
        }, 10)
    }
}