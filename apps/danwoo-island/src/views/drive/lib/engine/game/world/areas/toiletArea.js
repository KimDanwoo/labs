import * as THREE from 'three/webgpu'
import { rebuildOuthouse } from '../islandStructures'
import { rebuildVillageProps } from '../islandVillage'
import { getGame } from '../../gameContext'
import { Area } from './area'

export class ToiletArea extends Area
{
    setObjects()
    {
        rebuildOuthouse(this.model, this.game.materials)
        rebuildVillageProps(this.model, this.game.materials)
        super.setObjects()
    }

    constructor(model)
    {
        super(model)

        this.setCabin()
        this.setCandleFlames()
    }

    setCabin()
    {
        this.cabin = {}
        this.cabin.body = this.references.items.get('cabin')[0].userData.object.physical.body
        this.cabin.down = false
    }

    setCandleFlames()
    {
        const mesh = this.references.items.get('moon')[0]
        mesh.visible = this.game.dayCycles.isInInterval('night')

        this.game.dayCycles.events.on('night', (inInterval) =>
        {
            mesh.visible = inInterval
        })
    }

    update()
    {
        if(!this.cabin.down && !this.cabin.body.isSleeping())
        {
            const cabinUp = new THREE.Vector3(0, 1, 0)
            cabinUp.applyQuaternion(this.cabin.body.rotation())
            if(cabinUp.y < 0.4)
            {
                this.cabin.down = true
            }
        }
    }
}
