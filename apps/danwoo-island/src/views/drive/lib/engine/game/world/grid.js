import * as THREE from 'three/webgpu'
import { Game } from '../game'
import MeshGridMaterial, { MeshGridMaterialLine } from '../materials/meshGridMaterial'
import { float, normalWorld, positionWorld, vec3, vec4 } from 'three/tsl'
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial'
import { Fn } from 'three/tsl'
import { isTideLoading, tideSeaMaterial } from './tideLoading'

export class Grid
{
    constructor()
    {
        this.game = Game.getInstance()

        this.setVisual()
    }

    setVisual()
    {
        if(isTideLoading)
        {
            this.addPlane(tideSeaMaterial(this.game))
            return
        }

        const lines = [
            new MeshGridMaterialLine('#8d55ff', 10, 0.02, 0.2),
            new MeshGridMaterialLine('#675369', 100, 0.002, 1),
        ]

        const uvGridMaterial = new MeshGridMaterial({
            color: 0x1b191f,
            scale: 0.001,
            antialiased: true,
            reference: 'uv',
            side: THREE.DoubleSide,
            lines
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