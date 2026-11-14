import * as THREE from 'three/webgpu'
import { COCONUT_SIZE, makeCoconut, rebuildVillageProps } from '../islandVillage'
import { rebuildCookieCart } from '../islandStructures'
import { Game } from '../../game'
import { color, float, Fn, instancedArray, mix, normalWorld, positionGeometry, step, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { InstancedGroup } from '../../instancedGroup'
import gsap from 'gsap'
import { InteractivePoints } from '../../interactivePoints'
import { MeshDefaultMaterial } from '../../materials/meshDefaultMaterial'
import { alea } from 'seedrandom'
import { Area } from './area'

export class CookieArea extends Area
{
    setObjects()
    {
        rebuildVillageProps(this.model, this.game.materials)
        makeCoconut(this.model.children.find((child) => child.name === 'refCookie'), this.game.materials)
        rebuildCookieCart(this.model, this.game.materials)
        super.setObjects()
    }

    constructor(model)
    {
        super(model)

        this.setSound()
        this.setBlower()
        this.setBanner()
        this.setParticles()
        this.setOvenHeat()
        this.setCookies()
        this.setInteractivePoint()
    }

    setSound()
    {
        this.sounds = {}

        this.sounds.ding = this.game.audio.register({
            path: 'sounds/ding/Cash Register 03.mp3',
            autoplay: false,
            loop: false,
            volume: 0.4,
            antiSpam: 0.15,
            onPlay: (item) =>
            {
                item.volume = 0.3 + Math.random() * 0.2
                item.rate = 1 + Math.random() * 0.05
            }
        })
    }

    setBlower()
    {
        this.blower = this.references.items.get('blower')[0]
    }

    setBanner()
    {
        const windStrength = float(0).toVarying()

        const mesh = this.references.items.get('banner')[0]

        mesh.material.positionNode = Fn(() =>
        {
            const baseUv = uv()
            const newPosition = positionGeometry.toVar()

            const windUv = baseUv
                .mul(vec2(0.35, 0.175))
                .sub(vec2(0.1, 0.05).mul(this.game.ticker.elapsedScaledUniform))

            const noise = texture(this.game.noises.perlin, windUv).r
            windStrength.assign(noise.mul(baseUv.y).mul(this.game.wind.strength))
            const windDirection = vec3(0.5, 0, 1)
            newPosition.addAssign(windDirection.mul(windStrength))

            return newPosition
        })()
    }

    setParticles()
    {
        const emissiveMaterial = this.game.materials.getFromName('emissiveOrangeRadialGradient')

        const count = 30
        const elevation = uniform(3)
        const positions = new Float32Array(count * 3)
        const scales = new Float32Array(count)

        this.localTime = uniform(0)

        for(let i = 0; i < count; i++)
        {
            const i3 = i * 3

            const angle = Math.PI * 2 * Math.random()
            const radius = Math.pow(Math.random(), 1.5) * 0.4
            positions[i3 + 0] = Math.cos(angle) * radius
            positions[i3 + 1] = Math.random()
            positions[i3 + 2] = Math.sin(angle) * radius

            scales[i] = Math.random() * 1 + 0.75
        }

        const positionAttribute = instancedArray(positions, 'vec3').toAttribute()
        const scaleAttribute = instancedArray(scales, 'float').toAttribute()

        const material = new THREE.SpriteNodeMaterial()
        material.outputNode = emissiveMaterial.outputNode

        const progress = float(0).toVar()

        material.positionNode = Fn(() =>
        {
            const newPosition = positionAttribute.toVar()
            progress.assign(newPosition.y.add(this.localTime.mul(newPosition.y)).fract())

            newPosition.y.assign(progress.mul(elevation))

            const progressHide = step(0.8, progress).mul(100)
            newPosition.y.addAssign(progressHide)

            return newPosition
        })()
        material.scaleNode = Fn(() =>
        {
            const progressScale = progress.remapClamp(0.5, 1, 1, 0)
            return scaleAttribute.mul(progressScale)
        })()

        const geometry = new THREE.CircleGeometry(0.015, 8)

        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.copy(this.references.items.get('chimney')[0].position)
        mesh.count = count

        this.game.scene.add(mesh)

        let frustumNeedsUpdate = true
        this.events.on('frustumIn', () =>
        {
            if(frustumNeedsUpdate)
            {
                this.game.ticker.wait(2, () =>
                {
                    mesh.geometry.boundingSphere.center.y = 1
                    mesh.geometry.boundingSphere.radius = 1
                })
                frustumNeedsUpdate = false
            }
        })

        this.objects.hideable.push(mesh)
    }

    setOvenHeat()
    {
        const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, transparent: true, depthTest: true, depthWrite: false })

        material.outputNode = Fn(() =>
        {
            const noiseUv = uv().mul(vec2(2, 0.2))
            noiseUv.y.addAssign(this.game.ticker.elapsedScaledUniform.mul(0.05))
            const noise = texture(this.game.noises.perlin, noiseUv).r

            const strength = noise.mul(uv().y.pow(2))

            const emissiveMix = strength.smoothstep(0, 0.5)
            const emissiveColor = mix(color('#ff3e00'), color('#ff8641'), emissiveMix).mul(strength.add(1).mul(2))

            return vec4(vec3(emissiveColor), strength)
        })()

        this.ovenHeat = this.references.items.get('ovenHeat')[0]
        this.ovenHeat.material = material
        this.ovenHeat.castShadow = false
    }

    setCookies()
    {
        const baseCookie = this.references.items.get('cookie')[0]
        baseCookie.castShadow = true
        baseCookie.receiveShadow = true
        baseCookie.frustumCulled = true
        baseCookie.position.set(0, 0, 0)

        this.game.materials.updateObject(baseCookie)

        this.cookies = {}
        this.cookies.spawnerPosition = this.references.items.get('spawner')[0].position
        this.cookies.count = 20
        this.cookies.visibleCount = 0
        this.cookies.realCount = this.cookies.count + 2
        this.cookies.currentIndex = 0
        this.cookies.mass = 0.02
        this.cookies.objects = []

        const references = []

        for(let i = 0; i < this.cookies.realCount; i++)
        {
            const onTable = i >= this.cookies.count

            const reference = new THREE.Object3D()

            if(onTable)
            {
                reference.position.copy(this.references.items.get('table')[0].position)
                reference.position.y += (i - this.cookies.count) * 0.25
            }
            else
            {
                reference.position.copy(this.cookies.spawnerPosition)
                reference.position.y += 99
            }
            reference.needsUpdate = true
            references.push(reference)

            const object = this.game.objects.add(
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
                    sleeping: true,
                    enabled: onTable,
                    mass: this.cookies.mass,
                    colliders: [ { shape: 'cylinder', parameters: [ COCONUT_SIZE.y / 2, COCONUT_SIZE.x / 2 ], category: 'object' } ],
                    waterGravityMultiplier: - 1
                },
            )

            this.cookies.objects.push(object)
        }

        this.cookies.instancedGroup = new InstancedGroup(references, baseCookie)
    }

    setInteractivePoint()
    {
        this.game.interactivePoints.create(
            this.references.items.get('interactivePoint')[0].position,
            '코코넛 따기',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.accept()
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )
    }

    accept()
    {
        const object = this.cookies.objects[this.cookies.currentIndex]

        const spawnPosition = this.cookies.spawnerPosition.clone()
        spawnPosition.z += Math.random() - 0.5
        object.physical.body.setTranslation(spawnPosition)
        object.physical.body.setEnabled(true)
        this.game.ticker.wait(2, () =>
        {
            const impulse = {
                x: (Math.random() - 0.5) * this.cookies.mass * 2,
                y: Math.random() * this.cookies.mass * 3,
                z: this.cookies.mass * 7
            }
            object.physical.body.applyImpulse(impulse, true)
            object.physical.body.applyTorqueImpulse({ x: 0, y: 0, z: 0 }, true)
        })

        this.cookies.currentIndex = (this.cookies.currentIndex + 1) % this.cookies.count

        this.cookies.visibleCount = Math.min(this.cookies.visibleCount + 1, this.cookies.count)

        this.ovenHeat.scale.z = 2
        gsap.to(this.ovenHeat.scale, { z: 1, overwrite: true, duration: 2, delay: 0.2, ease: 'power1.inOut' })

        this.sounds.ding.play()
    }

    update()
    {
        const timeScale = (Math.sin(this.game.ticker.elapsedScaled) * 0.3 + 0.5) * 0.3
        this.localTime.value += this.game.ticker.deltaScaled * timeScale

        this.blower.scale.y = Math.sin(this.game.ticker.elapsedScaled + Math.PI) * 0.25 + 0.75

        if(this.cookies.visibleCount)
        {
            let allCookiesSleeping = true
            for(const fan of this.cookies.objects)
                allCookiesSleeping = allCookiesSleeping && fan.physical.body.isSleeping()

            if(!allCookiesSleeping)
                this.cookies.instancedGroup.updateBoundings()
        }

        for(const object of this.cookies.objects)
        {
            if(!object.physical.body.isSleeping() && object.physical.body.isEnabled())
                object.visual.object3D.needsUpdate = true
        }
    }
}
