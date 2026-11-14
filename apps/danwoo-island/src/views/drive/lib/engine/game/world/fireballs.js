import * as THREE from 'three/webgpu'
import { Game } from '../game'
import { Fn, mix, positionGeometry, texture, vec3, vec4, normalGeometry, dot, max, min, mul, add, color, luminance, step, uniform, positionWorld } from 'three/tsl'
import gsap from 'gsap'

export class Fireballs
{
    constructor()
    {
        this.game = Game.getInstance()

        this.geometry = new THREE.SphereGeometry(0.5, 12, 6)

        this.emissiveColorA = uniform(color('red'))
        this.emissiveColorB = uniform(color('orange'))
        this.emissiveStrength = uniform(8)
    }

    create(coordinates, fireRadius = 5, explosionRadius = 5)
    {
        const material = new THREE.MeshBasicNodeMaterial({ wireframe: false })

        const progress = uniform(0.5)
        material.outputNode = Fn(() =>
        {
            const noiseUvX = positionGeometry.yz.mul(0.8)
            const noiseUvY = positionGeometry.xz.mul(0.8).add(0.8)
            const noiseUvZ = positionGeometry.xy.mul(0.8).add(1.6)

            const noiseX = texture(this.game.noises.perlin, noiseUvX, 1).r
            const noiseY = texture(this.game.noises.perlin, noiseUvY, 1).r
            const noiseZ = texture(this.game.noises.perlin, noiseUvZ, 1).r

            const blending = normalGeometry.abs().normalize()
            blending.assign(blending.div(blending.x.add(blending.y).add(blending.z)))

            const noise = add(
                noiseX.mul(blending.x),
                noiseY.mul(blending.y),
                noiseZ.mul(blending.z),
            ).remap(0.15, 0.9, 0, 1).toVar()

            noise.mulAssign(positionWorld.y.mul(2).clamp(0, 1))

            noise.subAssign(progress)

            const emissiveColor = mix(
                this.emissiveColorA,
                this.emissiveColorB,
                noise
            )
            emissiveColor.mulAssign(this.emissiveStrength)

            const gooColor = this.game.fog.strength.mix(vec3(0), this.game.fog.color)

            const gooMask = step(noise, 0.1)
            const finalColor = mix(emissiveColor, gooColor, gooMask)

            noise.lessThan(0).discard()

            return vec4(vec3(finalColor), 1)
        })()

        const mesh = new THREE.Mesh(this.geometry, material)
        mesh.position.copy(coordinates)
        mesh.rotation.reorder('XYZ')
        mesh.rotation.x = Math.random() * Math.PI * 2
        mesh.rotation.y = Math.random() * Math.PI * 2
        this.game.scene.add(mesh)

        const scale = { value: 0 }
        gsap.fromTo(scale, { value: 0.5 }, { value: fireRadius, duration: 0.6, delay: 0, ease: 'power3.out', onUpdate: () => { mesh.scale.setScalar(scale.value) } })
        gsap.fromTo(mesh.rotation, { z: 0 }, { z: - 1 , duration: 2.25, delay: 0, ease: 'linear' })
        gsap.fromTo(progress, { value: 0.15 }, { value: 1, duration: 2, delay: 0.25, ease: 'linear' })

        this.game.explosions.explode(coordinates, explosionRadius, 8)

        gsap.delayedCall(2.25, () =>
        {
            mesh.removeFromParent()
            material.dispose()
        })
    }
}