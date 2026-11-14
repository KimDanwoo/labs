import * as THREE from 'three/webgpu'
import { rebuildWaterfallPagoda } from '../islandStructures'
import { rebuildVillageProps } from '../islandVillage'
import { paintAchievementsBasin } from '../islandReskins'
import { add, color, cos, float, Fn, instancedArray, instancedBufferAttribute, instanceIndex, max, min, mix, PI2, positionGeometry, positionWorld, sin, texture, uniform, uv, varying, vec2, vec3, vec4 } from 'three/tsl'
import { InteractivePoints } from '../../interactivePoints'
import { MeshDefaultMaterial } from '../../materials/meshDefaultMaterial'
import { Area } from './area'
import { alea } from 'seedrandom'

const rng = new alea('achievements')

export class AchievementsArea extends Area
{
    setObjects()
    {
        rebuildWaterfallPagoda(this.model, this.game.materials)
        paintAchievementsBasin(this.model, this.game.materials)
        rebuildVillageProps(this.model, this.game.materials)
        super.setObjects()
    }

    constructor(model)
    {
        super(model)

        this.setSounds()
        this.setWaterfall()
        this.setPillar()
    }

    setSounds()
    {
        this.sounds = {}

        this.sounds.chimers = this.game.audio.register({
            path: 'sounds/magic/Mountain Audio - Small Chimes - Loop.mp3',
            autoplay: true,
            loop: true,
            volume: 0.15,
            positions: this.references.items.get('pillar')[0].position,
            distanceFade: 20
        })
    }

    setWaterfall()
    {
        const waterColorA = uniform(color(this.game.terrain.colors[1].value))
        const waterColorB = uniform(color(this.game.terrain.colors[2].value))

        {
            const colorNode = Fn(() =>
            {
                const baseUv = uv().toVar()
                const baseColor = color()

                {
                    const xMix = baseUv.x.sub(0.5).mul(2).abs().pow3().max(0)

                    const waterColor = mix(waterColorB, waterColorA, xMix)
                    baseColor.assign(waterColor)
                }

                {
                    const newUv = baseUv.toVar()
                    newUv.x.assign(newUv.x.sub(0.5).abs().mul(2))
                    const uv3 = newUv.sub(vec2(this.game.ticker.elapsedScaledUniform.mul(0.05), 0)).mul(vec2(0.35, 0.96))
                    const noise3 = texture(this.game.noises.voronoi, uv3).r

                    const uv4 = newUv.sub(vec2(this.game.ticker.elapsedScaledUniform.mul(0.041), 0)).mul(vec2(0.75, 1.28))
                    const noise4 = texture(this.game.noises.voronoi, uv4).r

                    const noiseFinal = min(noise3, noise4)
                    const stepTreshold = baseUv.x.sub(0.5).abs().mul(2).add(0.5).mul(0.5).oneMinus()
                    const foamMix = noiseFinal.step(stepTreshold)

                    baseColor.assign(mix(baseColor, color('#ffffff'), foamMix))
                }

                return vec3(baseColor)
            })()
            const material = new MeshDefaultMaterial({
                colorNode: colorNode,
                hasLightBounce: false,
                hasWater: false,
                hasReveal: false
            })
            const mesh = this.references.items.get('waterfallStill')[0]
            mesh.material = material
        }

        {
            const colorNode = Fn(() =>
            {
                const baseUv = uv().toVar()

                {
                    const uv3 = baseUv.sub(vec2(0, this.game.ticker.elapsedScaledUniform.mul(0.11))).mul(vec2(0.7, 0.6))
                    const noise3 = texture(this.game.noises.voronoi, uv3).r

                    const uv4 = baseUv.sub(vec2(0, this.game.ticker.elapsedScaledUniform.mul(0.085))).mul(vec2(1.5, 0.8))
                    const noise4 = texture(this.game.noises.voronoi, uv4).r

                    const noiseFinal = min(noise3, noise4)
                    const stepTreshold = baseUv.y.sub(0.5).abs().mul(2).add(0.5).mul(0.5)
                    noiseFinal.lessThan(stepTreshold).discard()
                }

                return vec3(1)
            })()
            const material = new MeshDefaultMaterial({
                colorNode: colorNode,
                hasLightBounce: false,
                hasWater: false,
                hasReveal: false
            })
            const mesh = this.references.items.get('waterfallDrop')[0]
            mesh.material = material
        }

        {
            const reference = this.references.items.get('waterfallParticles')[0]
            reference.removeFromParent()

            const origin = new THREE.Vector3(
                reference.geometry.attributes.position.array[0],
                reference.geometry.attributes.position.array[1],
                reference.geometry.attributes.position.array[2]
            )
            const destination = new THREE.Vector3(
                reference.geometry.attributes.position.array[3],
                reference.geometry.attributes.position.array[4],
                reference.geometry.attributes.position.array[5]
            )
            origin.applyMatrix4(reference.matrixWorld)
            destination.applyMatrix4(reference.matrixWorld)

            const length = origin.distanceTo(destination)
            const delta = destination.clone().sub(origin)

            const count = 100
            const positions = new Float32Array(count * 3)
            const angles = new Float32Array(count)

            for(let i = 0; i < count; i++)
            {
                positions[i * 3 + 0] = 0
                positions[i * 3 + 1] = 0
                positions[i * 3 + 2] = length * Math.random()

                angles[i] = Math.PI - Math.PI * 0.5 * Math.random()
            }

            const positionAttribute = instancedArray(positions, 'vec3').toAttribute()
            const angleAttribute = instancedArray(angles, 'float').toAttribute()

            const material = new MeshDefaultMaterial({
                hasLightBounce: false,
                hasWater: false,
                hasReveal: false,
                alphaTest: 0.1,
            })

            material.positionNode = Fn(() =>
            {
                const progress = this.game.ticker.elapsedScaledUniform.mul(0.2).add(float(instanceIndex).div(count)).fract()

                const scale = progress.oneMinus().mul(0.4)
                const newPositionGeometry = positionGeometry.toVar().mul(scale)

                const finalPosition = newPositionGeometry.add(positionAttribute).toVar()

                const distance = progress.oneMinus().pow2().oneMinus()
                finalPosition.y.addAssign(sin(angleAttribute).mul(distance).mul(2))
                finalPosition.x.addAssign(cos(angleAttribute).mul(distance).mul(1.5))
                return finalPosition
            })()

            material._alphaNode = Fn(() =>
            {
                const distanceToCenter = uv().sub(0.5).length().oneMinus().sub(0.5)
                return distanceToCenter
            })()

            const geometry = new THREE.PlaneGeometry(1, 1)
            geometry.rotateY(-Math.PI * 0.5)
            geometry.rotateZ(-Math.PI * 0.25)

            const mesh = new THREE.InstancedMesh(
                geometry,
                material,
                count
            )
            mesh.receiveShadow = true
            mesh.castShadow = true
            mesh.lookAt(delta.multiplyScalar(-1))
            mesh.position.copy(destination)
            mesh.count = count
            this.game.scene.add(mesh)
            this.objects.hideable.push(mesh)
        }
    }

    setPillar()
    {
        this.pillar = this.references.items.get('pillar')[0]
    }

    update()
    {
        this.pillar.position.y = Math.sin(this.game.ticker.elapsedScaled * 0.1) * 0.25
    }
}
