import * as THREE from 'three/webgpu'
import { getGame } from '../gameContext'
import { MeshGridMaterial } from '../materials/meshGridMaterial'
import { float, normalWorld, positionWorld, vec3, vec4 } from 'three/tsl'
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial'
import { Fn } from 'three/tsl'
import { isTideLoading, tideSeaMaterial } from './tideLoading'

export class Grid
{
    constructor()
    {
        this.game = getGame()

        this.setVisual()
    }

    setVisual()
    {
        if(isTideLoading)
        {
            this.addPlane(tideSeaMaterial(this.game))
            return
        }

        const uvGridMaterial = new MeshGridMaterial({
            color: 0x1b191f,
            scale: 0.001,
            side: THREE.DoubleSide,
            lines: [
                { color: '#8d55ff', scale: 10, thickness: 0.02, cross: 0.2 },
                { color: '#675369', scale: 100, thickness: 0.002, cross: 1 },
            ],
        })

        const defaultMaterial = new MeshDefaultMaterial({
            colorNode: uvGridMaterial.outputNode.rgb,
            hasWater: false,
            hasReveal: false,
            hasLightBounce: false
        })

        uvGridMaterial.outputNode = Fn(() =>
        {
            const distanceToCenter = positionWorld.xz.sub(this.game.reveal.position2Uniform).length()
            distanceToCenter.lessThan(this.game.reveal.distance).discard()

            return defaultMaterial.outputNode
        })()

        this.addPlane(uvGridMaterial)
    }

    addPlane(material)
    {
        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), material)
        this.mesh.rotation.x = - Math.PI * 0.5

        const defaultRespawn = this.game.respawns.getDefault()
        this.mesh.position.set(defaultRespawn.position.x, 0, defaultRespawn.position.z)

        this.game.scene.add(this.mesh)
    }

    show()
    {
        this.game.scene.add(this.mesh)
    }

    destroy()
    {
        this.mesh.material.dispose()
        this.mesh.geometry.dispose()
        this.mesh.removeFromParent()
    }
}