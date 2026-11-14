import * as THREE from 'three/webgpu'
import { getGame } from './gameContext'
import { bool, color, float, Fn, If, mix, positionGeometry, texture, uniform, vec2, vec3, vec4, viewportCoordinate, viewportSize, screenUV, min, max, mul } from 'three/tsl'
import gsap from 'gsap'

export class Overlay
{
    constructor()
    {
        this.game = getGame()

        this.setSounds()

        const colorA = uniform(color('#251f2b'))
        const colorB = uniform(color('#1d1721'))
        this.progress = uniform(0)
        this.patternSize = uniform(200 * this.game.viewport.pixelRatio)
        this.strokeSize = uniform(10)
        this.inverted = uniform(0)
        const diagonalAmplitude = 0.5
        const diagonalInvertMultipilier = 1 + diagonalAmplitude * 2

        const geometry = new THREE.PlaneGeometry(2, 2)

        const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthTest: false, depthWrite: false })
        material.outputNode = Fn(() =>
        {
            const strokeMask = viewportCoordinate.x.add(viewportCoordinate.y).div(this.strokeSize).mod(1).sub(0.5).mul(2).abs()

            const patternUv = viewportCoordinate.div(this.patternSize).mod(1)
            const patternMask = texture(this.game.resources.overlayPatternTexture, patternUv).a.remap(0, 0.68, 0, 1).toVar()

            If(this.inverted.greaterThan(0.5), () =>
            {
                patternMask.assign(patternMask.oneMinus())
            })

            const mask = patternMask.add(strokeMask.mul(0.2)).mul(1 / (1 + 0.2))

            const diagonalRatio = screenUV.length().div(1.414).toVar()
            If(this.inverted.greaterThan(0.5), () =>
            {
                diagonalRatio.assign(diagonalRatio.oneMinus())
            })
            const diagonalProgress = this.progress.sub(diagonalRatio.mul(diagonalAmplitude)).mul(diagonalInvertMultipilier)

            diagonalProgress.lessThan(mask).discard()

            const colorHash = texture(this.game.noises.hash, viewportCoordinate.div(this.game.noises.resolution)).r.sub(0.5).mul(0.2)
            const colorMix = screenUV.length().add(colorHash)
            const finalColor = mix(colorA, colorB, colorMix)

            return vec4(finalColor, 1)
        })()
        material.vertexNode = vec4(positionGeometry.x, positionGeometry.y, 0, 1)

        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.frustumCulled = false
        this.mesh.renderOrder = 99
        this.mesh.visible = true
        this.game.scene.add(this.mesh)

        this.game.viewport.events.on('change', () =>
        {
            this.patternSize.value = 200 * this.game.viewport.pixelRatio
        })
    }

    setSounds()
    {
        this.sounds = {}

        this.sounds.show = this.game.audio.register({
            path: 'sounds/swoosh/Swoosh 02.mp3',
            autoplay: false,
            loop: false,
            volume: 0.25
        })

        this.sounds.hide = this.game.audio.register({
            path: 'sounds/swoosh/Swoosh 05.mp3',
            autoplay: false,
            loop: false,
            volume: 0.25
        })
    }

    show(callback)
    {
        this.inverted.value = 0
        this.mesh.visible = true
        this.sounds.show.play()
        gsap.to(this.progress, { value: 1, ease: 'power1.inOut', overwrite: true, duration: 2, onComplete: () =>
        {
            if(typeof callback === 'function')
                callback()
        } })
    }

    hide(callback)
    {
        this.inverted.value = 1
        this.sounds.hide.play()
        gsap.to(this.progress, { value: 0, ease: 'power1.inOut', overwrite: true, duration: 4, onComplete: () =>
        {
            this.mesh.visible = false

            if(typeof callback === 'function')
                callback()
        } })
    }

    moveOnTop()
    {
        this.game.scene.add(this.mesh)
    }
}