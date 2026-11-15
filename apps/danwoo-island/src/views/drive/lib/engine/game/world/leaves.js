import * as THREE from 'three/webgpu'
import { getGame } from '../gameContext'
import { color, float, Fn, hash, instancedArray, instanceIndex, materialNormal, max, mix, mod, modelViewMatrix, normalWorld, positionGeometry, remapClamp, rotateUV, sin, smoothstep, step, texture, uniform, vec2, vec3, vec4 } from 'three/tsl'
import { remap } from '../utilities/maths'
import gsap from 'gsap'
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial'

export class Leaves
{
    constructor()
    {
        this.game = getGame()

        const power = Math.round(remap((this.game.yearCycles.properties.leaves.value), [0.25, 1], [7, 11]))
        this.count = Math.pow(2, power)

        this.setGeometry()
        this.setMaterial()
        this.setMesh()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 10)
    }

    setGeometry()
    {
        const petal = new THREE.Shape()
        petal.moveTo(0, - 0.5)
        petal.quadraticCurveTo(0.5, - 0.2, 0.32, 0.4)
        petal.lineTo(0.1, 0.5)
        petal.lineTo(0, 0.36)
        petal.lineTo(- 0.1, 0.5)
        petal.lineTo(- 0.32, 0.4)
        petal.quadraticCurveTo(- 0.5, - 0.2, 0, - 0.5)
        this.geometry = new THREE.ShapeGeometry(petal, 3)

        this.geometry.rotateX(- Math.PI * 0.5)
    }

    setMaterial()
    {
        this.focusPoint = uniform(vec2())
        this.vehicleVelocity = uniform(vec3())
        this.vehiclePosition = uniform(vec3())
        this.scale = uniform(0.25)
        this.rotationFrequency = uniform(3)
        this.rotationElevationMultiplier = uniform(1)
        this.pushSidewaysMultiplier = uniform(20)
        this.pushMultiplier = uniform(100)
        this.windFrequency = uniform(0.005)
        this.windMultiplier = uniform(0.5)
        this.upwardMultiplier = uniform(1)
        this.defaultDamping = uniform(1.5)
        this.waterDamping = uniform(0.75)
        this.gravity = uniform(9.807)
        this.explosion = uniform(vec4(0))
        this.tornado = uniform(vec4(0))

        this.positionBuffer = instancedArray(this.count, 'vec3')
        this.velocityBuffer = instancedArray(this.count, 'vec3')

        const baseRotationArray = new Float32Array(this.count)
        for(let i = 0; i < this.count; i++)
            baseRotationArray[i] = Math.random() * Math.PI * 2
        const baseRotationBuffer = instancedArray(baseRotationArray, 'float').toAttribute()

        const scaleArray = new Float32Array(this.count)
        for(let i = 0; i < this.count; i++)
            scaleArray[i] = Math.random() * 0.5 + 0.5
        const scaleBuffer = instancedArray(scaleArray, 'float').toAttribute()

        const weightArray = new Float32Array(this.count)
        for(let i = 0; i < this.count; i++)
            weightArray[i] = Math.random() * 0.1 + 0.1
        const weightBuffer = instancedArray(weightArray, 'float')

        const colorA = uniform(color(0xe17f9c))
        const colorB = uniform(color(0xffd3de))
        const colorNode = Fn(() =>
        {
            const mixStrength = hash(instanceIndex.add(99))
            return vec3(mix(colorA, colorB, mixStrength))
        })()

        const normalArray = new Float32Array(this.count * 3)
        for(let i = 0; i < this.count; i++)
        {
            const normal = new THREE.Vector3(0, 1, 0)
            normal.applyAxisAngle(new THREE.Vector3(1, 0, 0), (Math.random() - 0.5) * 2)
            normal.applyAxisAngle(new THREE.Vector3(0, 0, 1), (Math.random() - 0.5) * 2)
            normal.toArray(normalArray, i * 3)
        }
        const normalBuffer = instancedArray(normalArray, 'vec3').toAttribute()

        this.material = new MeshDefaultMaterial({
            side: THREE.DoubleSide,
            colorNode: colorNode,
            normalNode: normalWorld,
            hasWater: false,
            transparent: true
        })

        this.material.positionNode = Fn(() =>
        {
            materialNormal.assign(modelViewMatrix.mul(vec4(normalBuffer, 0)))

            const leavePosition = this.positionBuffer.toAttribute()

            const newPosition = positionGeometry.mul(scaleBuffer).mul(this.scale)

            const rotationMultiplier = max(leavePosition.y.mul(this.rotationElevationMultiplier), 0)

            const rotationZ = sin(leavePosition.x.mul(this.rotationFrequency)).mul(rotationMultiplier)
            const rotationX = sin(leavePosition.z.mul(this.rotationFrequency)).mul(rotationMultiplier)
            const rotationY = baseRotationBuffer

            newPosition.xy.assign(rotateUV(newPosition.xy, rotationZ, vec2(0)))
            newPosition.yz.assign(rotateUV(newPosition.yz, rotationX, vec2(0)))
            newPosition.xz.assign(rotateUV(newPosition.xz, rotationY, vec2(0)))

            return newPosition.add(leavePosition)
        })()

        this.size = float(this.game.view.optimalArea.radius * 2)

        const init = Fn(() =>
        {
            const position = this.positionBuffer.element(instanceIndex)

            position.assign(vec3(
                hash(instanceIndex).sub(0.5).mul(this.size),
                0,
                hash(instanceIndex.add(1)).sub(0.5).mul(this.size)
            ))

            const noiseUv = position.xz.mul(0.02)
            const noise = texture(this.game.noises.perlin, noiseUv).r
            position.x.addAssign(noise.mul(15))
        })()
        const initCompute = init.compute(this.count)

        this.game.rendering.renderer.computeAsync(initCompute)

        const update = Fn(() =>
        {
            const position = this.positionBuffer.element(instanceIndex)
            const velocity = this.velocityBuffer.element(instanceIndex)
            const weight = weightBuffer.element(instanceIndex)

            const terrainData = this.game.terrain.terrainNode(position.xz)

            const vehicleDelta = position.sub(this.vehiclePosition)

            const pushSideways = vec3(vehicleDelta.x, 0, vehicleDelta.z).normalize().mul(this.pushSidewaysMultiplier)

            const pushVelocity = vec3(this.vehicleVelocity.x, 0, this.vehicleVelocity.z).mul(this.pushMultiplier)

            const distanceToVehicle = vehicleDelta.length()
            const vehicleMultiplier = distanceToVehicle.remapClamp(0.5, 2, 1, 0)
            const speedMultiplier = this.vehicleVelocity.length()
            const vehiclePush = pushVelocity.add(pushSideways).mul(speedMultiplier).mul(vehicleMultiplier)

            velocity.addAssign(vehiclePush)

            const noiseUv = position.xz.mul(this.windFrequency).add(this.game.wind.direction.mul(this.game.wind.localTime)).xy
            const noise = texture(this.game.noises.perlin, noiseUv).r

            const windStrength = this.game.wind.strength.sub(noise).mul(weight).mul(this.windMultiplier).max(0)
            velocity.x.addAssign(this.game.wind.direction.x.mul(windStrength))
            velocity.z.addAssign(this.game.wind.direction.y.mul(windStrength))

            const explosionDelta = position.xz.sub(this.explosion.xy)
            const distanceToExplosion = explosionDelta.length()
            const explosionMultiplier = distanceToExplosion.remapClamp(this.explosion.z.mul(0.5), this.explosion.z.mul(1), 0.2, 0)
            const explosionDirection = vec2(explosionDelta.x, explosionDelta.y)
            const explosionPush = explosionDirection.mul(explosionMultiplier).mul(this.explosion.a)

            velocity.addAssign(vec3(explosionPush.x, 0, explosionPush.y))

            const upwardDim = position.y.remapClamp(0, 6, 1, 0)
            velocity.y = velocity.xz.length().min(2).mul(this.upwardMultiplier).mul(upwardDim)

            const groundDamping = terrainData.b.remapClamp(0.4, 0, this.waterDamping, this.defaultDamping)
            const inTheAirDamping = step(0.05, position.y).mul(this.defaultDamping)
            const damping = max(groundDamping, inTheAirDamping).mul(this.game.ticker.deltaScaledUniform)
            velocity.mulAssign(float(1).sub(damping))

            velocity.y = velocity.y.sub(this.gravity.mul(weight))

            position.addAssign(velocity.mul(this.game.ticker.deltaScaledUniform))

            const floorY = terrainData.b.remapClamp(0.02, 0.13, 0, this.game.water.surfaceElevationUniform).add(0.02)
            position.y.assign(max(position.y, floorY))

            const halfSize = this.size.mul(0.5)
            position.x.assign(mod(position.x.add(halfSize).sub(this.focusPoint.x), this.size).sub(halfSize).add(this.focusPoint.x))
            position.z.assign(mod(position.z.add(halfSize).sub(this.focusPoint.y), this.size).sub(halfSize).add(this.focusPoint.y))
        })()
        this.updateCompute = update.compute(this.count)
    }

    setMesh()
    {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.count = this.count
        this.mesh.frustumCulled = false
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true
        this.mesh.renderOrder = 2
        this.game.scene.add(this.mesh)
    }

    explode(coordinates, radius)
    {
        this.explosion.value.x = coordinates.x
        this.explosion.value.y = coordinates.z
        this.explosion.value.z = radius
        this.explosion.value.w = 20
    }

    update()
    {
        this.focusPoint.value.set(this.game.view.optimalArea.position.x, this.game.view.optimalArea.position.z)

        this.vehicleVelocity.value.copy(this.game.physicalVehicle.velocity)
        this.vehiclePosition.value.copy(this.game.physicalVehicle.position)
        this.game.rendering.renderer.computeAsync(this.updateCompute)

        this.explosion.value.w = 0
    }
}