import * as THREE from 'three/webgpu'
import { rebuildBuildingSite } from '../islandStructures'
import { Game } from '../../game'
import { PortalSlabsGeometry } from '../../geometries/portalSlabsGeometry'
import { attribute, color, float, Fn, PI2, positionGeometry, sin, uniform, varying, vec2, vec4 } from 'three/tsl'
import { Area } from './area'

export class BehindTheSceneArea extends Area
{
    setObjects()
    {
        rebuildBuildingSite(this.model, this.game.materials)
        super.setObjects()
    }

    constructor(model)
    {
        super(model)

        this.center = this.references.items.get('center')[0].position

        this.setSounds()
        this.setSlabs()
    }

    setSounds()
    {
        this.sounds = {}

        this.sounds.chimers = this.game.audio.register({
            path: 'sounds/magic/Environmental Loop Scifi Bright Glassy Wandering Tones Layered 02.mp3',
            autoplay: true,
            loop: true,
            volume: 0.15,
            positions: this.references.items.get('interactivePoint')[0].position,
            distanceFade: 20
        })
    }

    setSlabs()
    {
        const geometry = new PortalSlabsGeometry(1.5, 6)

        const material = new THREE.MeshBasicMaterial({ wireframe: false })
        const effectVarying = varying(float())
        this.vehicleRelativePosition = uniform(vec2())
        this.chalkColor = uniform(color('#f3ead7'))
        this.chalkIntensity = uniform(1)

        material.positionNode = Fn(() =>
        {
            const random = attribute('random')
            const edge = attribute('edge')
            const center = attribute('center')
            const distanceToCenter = attribute('distanceToCenter')

            const newPosition = positionGeometry.toVar()

            const osciliation = sin(this.game.ticker.elapsedScaledUniform.mul(0.5).add(random.mul(PI2))).mul(0.5)

            const distanceToVehicle = center.sub(this.vehicleRelativePosition).length()

            const effect = distanceToCenter.remap(0, 3.5, 3, 0).toVar()
            effect.addAssign(osciliation)
            effect.assign(effect.clamp(0, 1))
            effect.addAssign(distanceToVehicle.remapClamp(2, 4, -1, 0))
            effectVarying.assign(effect)
            effect.mulAssign(edge)

            const toCenter = newPosition.xz.sub(center)
            toCenter.mulAssign(effect)
            newPosition.xz.subAssign(toCenter)

            return newPosition
        })()

        material.outputNode = Fn(() =>
        {
            const edge = attribute('edge')
            const edgeOffset = effectVarying.remapClamp(0.1, 1, 0.5, 0)
            const edgeTreshold = edge.remapClamp(0, 1, 0.98, 1)
            const strength = edge.toVar().sub(0.5).abs().mul(2).add(edgeOffset).step(edgeTreshold)
            strength.lessThan(0.5).discard()

            return vec4(this.chalkColor.mul(this.chalkIntensity), 1)
        })()

        this.slabs = new THREE.Mesh(geometry, material)
        this.slabs.position.copy(this.center)
        this.slabs.position.y += 0.01
        this.game.scene.add(this.slabs)
        this.objects.hideable.push(this.slabs)
    }

    update()
    {
        this.vehicleRelativePosition.value.x = this.game.physicalVehicle.position.x - this.slabs.position.x
        this.vehicleRelativePosition.value.y = this.game.physicalVehicle.position.z - this.slabs.position.z
    }
}
