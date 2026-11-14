import { STARTUP, setStartupStage } from '../../islandStartup'
import * as THREE from 'three/webgpu'
import { getGame } from '../gameContext'
import { atan, color, float, Fn, PI, PI2, positionGeometry, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import gsap from 'gsap'
import { Inputs } from '../inputs/inputs'
import { isTideLoading, TIDE_LABEL, tideRingGeometry, tideRingMaterial } from './tideLoading'

const LABEL_TINT = isTideLoading ? TIDE_LABEL : '#ffffff'

export class Intro
{
    constructor()
    {
        this.game = getGame()

        const respawn = this.game.respawns.getDefault()
        this.center = respawn.position.clone()

        this.setCircle()
        this.setLabel()

        this.update = this.update.bind(this)
        this.game.ticker.events.on('tick', this.update, 8)
    }

    setLabel()
    {
        this.label = new THREE.Group()
        this.label.position.copy(this.center)
        this.label.rotation.reorder('YXZ')

        if(this.game.quality.level === 0)
        {
            this.label.position.x += 3.5
            this.label.position.z -= 1
            this.label.position.y = 3.3

            this.label.rotation.y = 0.4
        }
        else
        {
            this.label.position.x += 2.3
            this.label.position.z -= 1.8
            this.label.position.y = 3.3

            this.label.rotation.y = 0.4
            this.label.rotation.x = -0.4
        }

        this.label.scale.setScalar(0.01)
        this.game.scene.add(this.label)
    }

    setCircle()
    {
        this.circle = {}

        const radius = 3.5
        const thickness = 0.04
        this.circle.progress = 0
        this.circle.smoothedProgress = uniform(0)

        const geometry = isTideLoading ? tideRingGeometry(radius) : new THREE.RingGeometry(radius - thickness, radius, 128, 1)
        const material = isTideLoading ? tideRingMaterial(this.circle.smoothedProgress, radius, this.game) : this.glowRingMaterial()

        const mesh = new THREE.Mesh(geometry, material)

        mesh.position.copy(this.center)
        mesh.position.y = 0.001
        mesh.rotation.x = - Math.PI * 0.5
        mesh.rotation.z = Math.PI * 0.5

        this.game.scene.add(mesh)

        this.circle.mesh = mesh

        this.circle.hide = (callback = null) =>
        {
            const dummy = { scale: 1 }
            gsap.to(
                dummy,
                {
                    scale: 0,
                    duration: 1.5,
                    ease: 'power4.in',
                    overwrite: true,
                    onUpdate: () =>
                    {
                        mesh.scale.setScalar(dummy.scale)
                    },
                    onComplete: () =>
                    {
                        if(typeof callback === 'function')
                            callback()

                        mesh.removeFromParent()
                    }
                }
            )
        }
    }

    glowRingMaterial()
    {
        const material = new THREE.MeshBasicNodeMaterial()
        material.outputNode = Fn(() =>
        {
            const angle = atan(positionGeometry.y, positionGeometry.x)
            const angleProgress = angle.div(PI2).add(0.5).oneMinus()

            this.circle.smoothedProgress.lessThan(angleProgress).discard()

            return vec4(this.game.reveal.color.mul(this.game.reveal.intensity), 1)
        })()
        return material
    }

    setText()
    {
        this.text = { textures: new Map() }
        const scale = 1.3
        const geometry = new THREE.PlaneGeometry(2 * scale, scale)
        const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
        const mesh = new THREE.Mesh(geometry, material)
        this.label.add(mesh)
        this.text.mesh = mesh

        this.text.updateTexture = () =>
        {
            const isTouch = this.game.inputs.mode === Inputs.MODE_TOUCH || window.matchMedia('(pointer: coarse)').matches
            const isGamepad = this.game.inputs.mode === Inputs.MODE_GAMEPAD
            const action = isGamepad
                ? (this.game.inputs.gamepad.type === 'xbox' ? 'A 버튼으로' : '× 버튼으로')
                : (isTouch ? '터치해서' : '클릭해서')
            let labelTexture = this.text.textures.get(action)
            if(!labelTexture)
            {
                const canvas = document.createElement('canvas')
                canvas.width = 1024
                canvas.height = 512
                const context = canvas.getContext('2d')
                if(!context) throw new Error('출발 안내를 그릴 수 없습니다.')
                context.fillStyle = '#000000'
                context.fillRect(0, 0, canvas.width, canvas.height)
                context.fillStyle = '#ffffff'
                context.textAlign = 'center'
                context.textBaseline = 'middle'
                context.font = '700 152px MaruBuri'
                context.fillText(action, 512, 150, 960)
                context.font = '700 224px MaruBuri'
                context.fillText('출발', 512, 355, 960)
                labelTexture = new THREE.CanvasTexture(canvas)
                this.text.textures.set(action, labelTexture)
            }
            material.outputNode = Fn(() =>
            {
                return vec4(color(LABEL_TINT), texture(labelTexture, uv()).r)
            })()
            material.needsUpdate = true
        }

        this.text.updateTexture()
        this.game.inputs.gamepad.events.on('typeChange', this.text.updateTexture)
        this.game.inputs.events.on('modeChange', this.text.updateTexture)
    }

    setSoundButton()
    {
        this.soundButton = {}

        const texture = this.game.resources.soundTexture

        if(this.game.audio.mute.active)
            texture.offset.x = 0.5

        const scale = 0.5
        const geometry = new THREE.PlaneGeometry(50 / 38 * scale, 1 * scale)

        const intensity = uniform(1)
        const material = new THREE.MeshBasicNodeMaterial({
            alphaTest: 0.5,
            alphaMap: texture,
            transparent: true,
            outputNode: vec4(vec3(1).mul(intensity), 1)
        })

        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.x = 0.38
        mesh.position.y = - 1
        this.label.add(mesh)

        const position = this.label.position.clone()
        position.x += 0.38
        position.y += - 1

        this.soundButton.intersect = this.game.rayCursor.addIntersect({
            active: true,
            shape: new THREE.Sphere(position, 0.5),
            onClick: () =>
            {
                this.game.audio.mute.toggle()
            },
            onEnter: () =>
            {
                gsap.to(intensity, { value: 1.5, duration: 0.3, overwrite: true })
            },
            onLeave: () =>
            {
                gsap.to(intensity, { value: 1, duration: 0.3, overwrite: true })
            }
        })

        this.game.audio.events.on('muteChange', (active) =>
        {
            texture.offset.x = active ? 0.5 : 0
        })

        this.soundButton.mesh = mesh
    }

    showLabel()
    {
        setStartupStage(STARTUP.ready)
        const dummy = { scale: 0 }
        gsap.to(
            dummy,
            {
                scale: 1,
                duration: 2,
                delay: 1,
                ease: 'elastic.out(0.5)',
                overwrite: true,
                onUpdate: () =>
                {
                    this.label.scale.setScalar(dummy.scale)
                }
            }
        )
    }

    hideLabel()
    {
        const dummy = { scale: 1 }
        gsap.to(
            dummy,
            {
                scale: 0,
                duration: 0.3,
                ease: 'power2.in',
                overwrite: true,
                onUpdate: () =>
                {
                    this.label.scale.setScalar(dummy.scale)
                },
                onComplete: () =>
                {
                    this.text.mesh.removeFromParent()
                    this.soundButton.mesh.removeFromParent()
                    this.game.rayCursor.removeIntersect(this.soundButton.intersect)
                }
            }
        )
    }

    updateProgress(progress)
    {
        this.circle.progress = progress
    }

    update()
    {
        this.circle.smoothedProgress.value += (this.circle.progress - this.circle.smoothedProgress.value) * this.game.ticker.delta * 10
    }

    destroy()
    {
        this.label.removeFromParent()

        this.circle.mesh.geometry.dispose()
        this.soundButton.mesh.geometry.dispose()
        this.text.mesh.geometry.dispose()

        this.circle.mesh.material.dispose()
        this.soundButton.mesh.material.dispose()
        this.text.mesh.material.dispose()

        this.game.resources.soundTexture.dispose()

        this.text.textures.forEach((value, key) =>
        {
            value.dispose()
        })

        this.game.ticker.events.off('tick', this.update)
        this.game.inputs.gamepad.events.off('typeChange', this.text.updateTexture)
        this.game.inputs.events.off('modeChange', this.text.updateTexture)
    }
}
