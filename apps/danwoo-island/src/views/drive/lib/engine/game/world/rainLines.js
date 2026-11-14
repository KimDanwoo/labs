import { autoBinding } from '../utilities/autoBinding'
import * as THREE from 'three/webgpu'
import { Game } from '../game'
import { attribute, clamp, color, float, Fn, fract, hash, instancedArray, instanceIndex, max, mod, normalWorld, positionGeometry, rotateUV, sin, smoothstep, step, texture, uniform, vec2, vec3, vec4 } from 'three/tsl'
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial'
import { lerp, remap, remapClamp } from '../utilities/maths'

export class RainLines
{
    constructor()
    {
        this.game = Game.getInstance()

        this.count = Math.pow(2, 11)
        this.speed = 0.25

        this.setGeometry()
        this.setMaterial()
        this.setMesh()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 10)

        this.game.viewport.events.on('throttleChange', () =>
        {
            this.size.value = this.game.view.optimalArea.radius * 2
        }, 2)

        this.visibleRatioBinding = autoBinding(this.visibleRatio, 'value', () =>
            {
                return Math.pow(this.game.weather.rain.value, 2)
            })

        this.lengthRatioBinding = autoBinding(this.length, 'value', () =>
            {
                const baseLength = remapClamp(this.game.weather.rain.value, [0, 1], [1, 3])

                const snowRatio = 1 - Math.pow(1 - Math.max(this.game.weather.snow.value, 0), 4)
                const snowLength = 0.03

                return lerp(baseLength, snowLength, snowRatio)
            })

        this.speedRatioBinding = autoBinding(this, 'speed', () =>
            {
                const baseSpeed = remapClamp(this.game.weather.rain.value, [0, 1], [0.2, 0.4])

                const snowRatio = 1 - Math.pow(1 - Math.max(this.game.weather.snow.value, 0), 4)
                const snowSpeed = 0.05

                return lerp(baseSpeed, snowSpeed, snowRatio)
            })

        this.inclineRatioBinding = autoBinding(this.incline, 'value', () =>
            {
                return remapClamp(this.game.weather.wind.value, [0, 1], [0.1, 0.4])
            })
    }

    setGeometry()
    {
        const positionArray = new Float32Array(this.count * 4 * 3)
        const offsetArray = new Float32Array(this.count * 4 * 2)
        const randomArray = new Float32Array(this.count * 4)
        const indexArray = new Uint16Array(this.count * 6)

        for(let lineIndex = 0; lineIndex < this.count; lineIndex++)
        {
            const x = Math.random()
            const y = 0
            const z = Math.random()
            const random = Math.random()

            for(let vertexIndex = 0; vertexIndex < 4; vertexIndex++)
            {
                const positionIndex = (lineIndex * 4 + vertexIndex) * 3

                positionArray[positionIndex + 0] = x
                positionArray[positionIndex + 1] = y
                positionArray[positionIndex + 2] = z

                const offsetIndex = (lineIndex * 4 + vertexIndex) * 2
                offsetArray[offsetIndex + 0] = 0
                offsetArray[offsetIndex + 1] = 0

                if(vertexIndex === 0 || vertexIndex === 1)
                    offsetArray[offsetIndex + 0] = 1

                if(vertexIndex === 0 || vertexIndex === 3)
                    offsetArray[offsetIndex + 1] = 1

                randomArray[lineIndex * 4 + vertexIndex] = random
            }

            indexArray[lineIndex * 6 + 0] = lineIndex * 4 + 0
            indexArray[lineIndex * 6 + 1] = lineIndex * 4 + 3
            indexArray[lineIndex * 6 + 2] = lineIndex * 4 + 2

            indexArray[lineIndex * 6 + 3] = lineIndex * 4 + 2
            indexArray[lineIndex * 6 + 4] = lineIndex * 4 + 1
            indexArray[lineIndex * 6 + 5] = lineIndex * 4 + 0
        }

        this.geometry = new THREE.BufferGeometry()
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionArray, 3))
        this.geometry.setAttribute('offset', new THREE.Float32BufferAttribute(offsetArray, 2))
        this.geometry.setAttribute('random', new THREE.Float32BufferAttribute(randomArray, 1))
        this.geometry.index = new THREE.Uint16BufferAttribute(indexArray, 1)
    }

    setMaterial()
    {
        this.material = new MeshDefaultMaterial({
            normalNode: vec3(0, 1, 0),
            transparent: true,
            wireframe: false,

            hasCoreShadows: true,
            hasDropShadows: false,
            hasLightBounce: false,
            hasFog: false,
            hasWater: false,
        })

        this.thickness = uniform(0.015)
        this.elevation = uniform(20)
        this.incline = uniform(0.2)
        this.size = uniform(this.game.view.optimalArea.radius * 2)
        this.center = uniform(vec2())
        this.length = uniform(2)
        this.localTime = uniform(0)
        this.visibleRatio = uniform(0)

        this.material.positionNode = Fn(() =>
        {
            const newPosition = attribute('position').toVar()
            const offset = attribute('offset')
            const random = attribute('random')
            const tangent = vec2(0.707, -0.707)

            newPosition.xz.mulAssign(this.size)
            newPosition.xz.subAssign(this.center)
            const halfSize = this.size.mul(0.5)
            newPosition.x.assign(mod(newPosition.x.add(halfSize), this.size).sub(halfSize))
            newPosition.z.assign(mod(newPosition.z.add(halfSize), this.size).sub(halfSize))
            newPosition.xz.addAssign(this.center)

            newPosition.xz.addAssign(tangent.mul(offset.x.mul(this.thickness)))

            const progress = this.localTime.add(random).mod(1)
            newPosition.y.assign(this.elevation.add(this.length))
            newPosition.y.subAssign(this.length.mul(offset.y.oneMinus()))
            newPosition.y.subAssign(progress.mul(this.elevation.add(this.length)))
            newPosition.y.assign(newPosition.y.clamp(0, this.elevation))

            const visible = step(this.visibleRatio, fract(random.mul(99)))
            newPosition.y.addAssign(visible.mul(99))

            newPosition.xz.addAssign(tangent.mul(newPosition.y.mul(this.incline).mul(-1)))

            return newPosition
        })()
    }

    setMesh()
    {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.position.y = - 0.3
        this.mesh.frustumCulled = false
        this.mesh.renderOrder = 1
        this.game.scene.add(this.mesh)
    }

    update()
    {
        this.visibleRatioBinding.update()
        this.lengthRatioBinding.update()
        this.speedRatioBinding.update()
        this.inclineRatioBinding.update()

        this.mesh.visible = this.visibleRatio.value > 0.00001

        if(this.mesh.visible)
        {
            this.center.value.set(this.game.view.optimalArea.position.x, this.game.view.optimalArea.position.z)
            this.localTime.value += this.game.ticker.deltaScaled * this.speed
        }
    }
}
