import { Game } from '../game'
import { InstancedGroup } from '../instancedGroup'
import { createRopeFence } from './islandProps'

export class Fences
{
    constructor()
    {
        this.game = Game.getInstance()

        const [ base, references ] = InstancedGroup.getBaseAndReferencesFromInstances(this.game.resources.fencesModel.scene.children)
        base.castShadow = true
        base.receiveShadow = true
        base.frustumCulled = true

        const descriptions = this.game.objects.getFromModel(base, {}, {})

        this.game.materials.updateObject(base)

        for(const child of base.children)
            child.name = child.name.replace(/[0-9]+$/i, '')

        this.objects = []
        for(const reference of references)
        {
            this.objects.push(this.game.objects.add(
                {
                    model: reference,
                    updateMaterials: false,
                    parent: null,
                },
                {
                    type: 'dynamic',
                    position: reference.position,
                    rotation: reference.quaternion,
                    friction: 0.7,
                    mass: 0.1,
                    sleeping: true,
                    colliders: descriptions[1].colliders,
                    waterGravityMultiplier: - 1,
                    contactThreshold: 10,
                    onCollision: (force, position) =>
                    {
                    }
                },
            ))
        }

        this.instancedGroup = new InstancedGroup(references, createRopeFence(this.game.materials))

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