import * as THREE from 'three/webgpu'
import { rebuildCircuitObjects, rebuildPodium, reshapeCircuitDecoration } from '../islandVillage'
import { replaceAirDancers } from '../islandReskins'
import { Game } from '../../game'
import { lerp, segmentCircleIntersection } from '../../utilities/maths'
import { InteractivePoints } from '../../interactivePoints'
import gsap from 'gsap'
import { Player } from '../../player'
import { MeshDefaultMaterial } from '../../materials/meshDefaultMaterial'
import { add, color, Fn, max, mix, PI, sin, texture, uniform, uv, vec2, vec4 } from 'three/tsl'
import { alea } from 'seedrandom'
import { Area } from './area'
import { timeToRaceString } from '../../utilities/time'

export class CircuitArea extends Area
{
    setObjects()
    {
        rebuildCircuitObjects(this.model, this.game.materials)
        rebuildPodium(this.model, this.game.materials)
        reshapeCircuitDecoration(this.model, this.game.materials)
        replaceAirDancers(this.model, this.game.materials)
        super.setObjects()
    }

    static STATE_PENDING = 1
    static STATE_STARTING = 2
    static STATE_RUNNING = 3
    static STATE_ENDING = 4

    constructor(model)
    {
        super(model)

        this.state = CircuitArea.STATE_PENDING

        this.setSounds()
        this.setStartPosition()
        this.setStartingLights()
        this.setTimer()
        this.setCheckpoints()
        this.setResetObjects()
        this.setObstacles()
        this.setRoad()
        this.setRails()
        this.setInteractivePoint()
        this.setStartAnimation()
        this.setRespawn()
        this.setBounds()
        this.setBanners()
        this.setMenu()
        this.setCourseSign()
        this.setEndModal()
        this.setPodium()

        this.game.materials.getFromName('circuitBrand').map.minFilter = THREE.LinearFilter
        this.game.materials.getFromName('circuitBrand').map.magFilter = THREE.LinearFilter
    }

    setSounds()
    {
        this.sounds = {}

        this.sounds.countdown1 = this.game.audio.register({
            path: 'sounds/circuit/countdown/Game Start Countdown 31-1.mp3',
            autoplay: false,
            loop: false,
            volume: 0.5,
            antiSpam: 0.1
        })

        this.sounds.countdown2 = this.game.audio.register({
            path: 'sounds/circuit/countdown/Game Start Countdown 31-2.mp3',
            autoplay: false,
            loop: false,
            volume: 0.5,
            antiSpam: 0.1
        })

        this.sounds.checkpoint = this.game.audio.register({
            path: 'sounds/circuit/checkpoint/Win Score 1.mp3',
            autoplay: false,
            loop: false,
            volume: 0.5,
            antiSpam: 0.1,
            onPlay: (item, reachedCount) =>
            {
                item.rate = 1 + (reachedCount - 1) * 0.06
            }
        })

        this.sounds.finish = this.game.audio.register({
            path: 'sounds/circuit/finish/Big Win Fanfare 2.mp3',
            autoplay: false,
            loop: false,
            volume: 0.5,
            antiSpam: 0.1
        })

        this.sounds.applause = this.game.audio.register({
            path: 'sounds/circuit/applause/huge win.mp3',
            autoplay: false,
            loop: false,
            volume: 0.5,
            antiSpam: 0.1
        })
    }

    setStartPosition()
    {
        const baseStart = this.references.items.get('start')[0]

        this.startPosition = {}
        this.startPosition.position = baseStart.position.clone()
        this.startPosition.rotation = baseStart.rotation.y
    }

    setStartingLights()
    {
        this.startingLights = {}
        this.startingLights.mesh = this.references.items.get('startingLights')[0]
        this.startingLights.mesh.visible = false
        this.startingLights.redMaterial = this.game.materials.getFromName('emissiveOrangeRadialGradient')
        this.startingLights.greenMaterial = this.game.materials.getFromName('emissiveGreenRadialGradient')
        this.startingLights.baseZ = this.startingLights.mesh.position.z

        this.startingLights.reset = () =>
        {
            this.startingLights.mesh.visible = false
            this.startingLights.mesh.material = this.startingLights.redMaterial
        }
    }

    setTimer()
    {
        this.timer = {}

        this.timer.visible = true
        this.timer.startTime = 0
        this.timer.elapsedTime = 0
        this.timer.running = false
        this.timer.group = this.references.items.get('timer')[0]
        this.timer.group.rotation.y = Math.PI * 0.1
        this.timer.group.visible = false
        this.timer.defaultPosition = this.timer.group.position.clone()

        {
            this.timer.digits = {}
            this.timer.digits.ratio = 6
            this.timer.digits.height = 32
            this.timer.digits.width = 32 * 6

            const font = `700 ${this.timer.digits.height}px "MaruBuri"`

            const canvas = document.createElement('canvas')
            canvas.style.position = 'fixed'
            canvas.style.zIndex = 999
            canvas.style.top = 0
            canvas.style.left = 0

            const context = canvas.getContext('2d')
            context.font = font

            canvas.width = this.timer.digits.height * this.timer.digits.ratio
            canvas.height = this.timer.digits.height

            context.fillStyle = '#000000'
            context.fillRect(0, 0, canvas.width, canvas.height)

            context.font = font
            context.fillStyle = '#ffffff'
            context.textAlign = 'center'
            context.textBaseline = 'middle'
            context.fillText('00:00:000', this.timer.digits.width * 0.5, this.timer.digits.height * 0.5)
            this.timer.digits.context = context

            const texture = new THREE.Texture(canvas)
            texture.minFilter = THREE.LinearFilter
            texture.magFilter = THREE.LinearFilter
            texture.generateMipmaps = false

            this.timer.digits.texture = texture

            const geometry = new THREE.PlaneGeometry(this.timer.digits.ratio, 1)
            const material = new THREE.MeshBasicNodeMaterial({
                alphaMap: this.timer.digits.texture,
                alphaTest: 0.5
            })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.scale.setScalar(0.5)
            this.timer.group.add(mesh)
        }

        this.timer.write = (text) =>
        {
            this.timer.digits.context.fillStyle = '#000000'
            this.timer.digits.context.fillRect(0, 0, this.timer.digits.width, this.timer.digits.height)

            this.timer.digits.context.fillStyle = '#ffffff'
            this.timer.digits.context.fillText(text, this.timer.digits.width * 0.5, this.timer.digits.height * 0.5)

            this.timer.digits.texture.needsUpdate = true
        }

        this.timer.show = () =>
        {
            this.timer.visible = true

            this.timer.write('00:00:000')

            this.timer.group.position.copy(this.game.player.position)
            this.timer.group.position.y = 2.5
            this.timer.group.scale.setScalar(1)

            this.timer.group.visible = true
        }

        this.timer.hide = () =>
        {
            const value = { scale: 1 }

            gsap.to(
                value,
                {
                    scale: 0,
                    duration: 1,
                    ease: 'back.in(2)',
                    onUpdate: () =>
                    {
                        this.timer.group.scale.setScalar(value.scale)
                    },
                }
            )

            this.timer.visible = false
        }

        this.timer.start = () =>
        {
            this.timer.running = true

            this.timer.startTime = this.game.ticker.elapsed
        }

        this.timer.end = () =>
        {
            this.timer.running = false
            this.timer.elapsedTime = this.game.ticker.elapsed - this.timer.startTime

            const formatedTime = timeToRaceString(this.timer.elapsedTime)
            this.timer.write(formatedTime)

            this.endModal.timeElement.textContent = formatedTime
        }

        this.timer.update = () =>
        {
            const target = new THREE.Vector3()

            if(this.state === CircuitArea.STATE_PENDING)
            {
                target.x = this.timer.defaultPosition.x
                target.y = 2.5
                target.z = this.timer.defaultPosition.z
            }
            else
            {
                target.x = this.game.player.position.x - 2
                target.y = 2.5
                target.z = this.game.player.position.z + 1
            }

            this.timer.group.position.lerp(target, this.game.ticker.deltaScaled * 5)

            if(this.timer.running)
            {
                this.timer.elapsedTime = this.game.ticker.elapsed - this.timer.startTime
                this.timer.write(timeToRaceString(this.timer.elapsedTime))
            }
        }
    }

    setCheckpoints()
    {
        this.checkpoints = {}
        this.checkpoints.items = []
        this.checkpoints.count = 0
        this.checkpoints.checkRadius = 2
        this.checkpoints.target = null
        this.checkpoints.last = null
        this.checkpoints.reachedCount = 0
        this.checkpoints.timings = []

        const baseCheckpoints = this.references.items.get('checkpoints').sort((a, b) => a.name.localeCompare(b.name))

        let i = 0
        for(const baseCheckpoint of baseCheckpoints)
        {
            const checkpoint = {}

            baseCheckpoint.rotation.reorder('YXZ')
            baseCheckpoint.visible = false

            checkpoint.index = i
            checkpoint.position = baseCheckpoint.position.clone()
            checkpoint.rotation = baseCheckpoint.rotation.y
            checkpoint.scale = baseCheckpoint.scale.x * 0.5

            checkpoint.respawnPosition = baseCheckpoint.position.clone()
            const direction = new THREE.Vector2(3, 0)
            direction.rotateAround(new THREE.Vector2(), checkpoint.rotation)
            checkpoint.respawnPosition.x += direction.y
            checkpoint.respawnPosition.y = 4
            checkpoint.respawnPosition.z += direction.x

            checkpoint.center = new THREE.Vector2(checkpoint.position.x, checkpoint.position.z)

            checkpoint.a = new THREE.Vector2(checkpoint.position.x - checkpoint.scale, checkpoint.position.z)
            checkpoint.b = new THREE.Vector2(checkpoint.position.x + checkpoint.scale, baseCheckpoint.position.z)

            checkpoint.a.rotateAround(checkpoint.center, - checkpoint.rotation)
            checkpoint.b.rotateAround(checkpoint.center, - checkpoint.rotation)

            checkpoint.setTarget = () =>
            {
                this.checkpoints.target = checkpoint

                this.checkpoints.doorTarget.scaleUniform.value = checkpoint.scale
                this.checkpoints.doorTarget.mesh.visible = true
                this.checkpoints.doorTarget.mesh.position.copy(checkpoint.position)
                this.checkpoints.doorTarget.mesh.rotation.y = checkpoint.rotation
                this.checkpoints.doorTarget.mesh.scale.x = checkpoint.scale
            }

            checkpoint.reach = () =>
            {
                if(checkpoint !== this.checkpoints.target)
                    return

                if(this.game.world.confetti)
                {
                    this.game.world.confetti.pop(new THREE.Vector3(checkpoint.a.x, 0, checkpoint.a.y))
                    this.game.world.confetti.pop(new THREE.Vector3(checkpoint.b.x, 0, checkpoint.b.y))
                }

                this.checkpoints.doorReached.scaleUniform.value = checkpoint.scale
                this.checkpoints.doorReached.mesh.visible = true
                this.checkpoints.doorReached.mesh.position.copy(checkpoint.position)
                this.checkpoints.doorReached.mesh.rotation.y = checkpoint.rotation
                this.checkpoints.doorReached.mesh.scale.x = checkpoint.scale

                this.checkpoints.last = checkpoint
                this.checkpoints.reachedCount++

                this.sounds.checkpoint.play(this.checkpoints.reachedCount)

                this.checkpoints.timings.push(Math.round(this.timer.elapsedTime * 1000))

                if(this.checkpoints.reachedCount === this.checkpoints.count + 2)
                {
                    this.finish()
                }

                else
                {
                    const newTarget = this.checkpoints.items[this.checkpoints.reachedCount % (this.checkpoints.count + 1)]
                    newTarget.setTarget()
                }

                this.checkpoints.target
            }

            this.checkpoints.count = this.checkpoints.items.length

            this.checkpoints.items.push(checkpoint)

            i++
        }

        const doorIntensity = uniform(2)
        const doorOutputColor = Fn(([doorColor, doorScale]) =>
        {
            const baseUv = uv()

            const squaredUV = baseUv.toVar()
            squaredUV.y.subAssign(this.game.ticker.elapsedScaledUniform.mul(0.2))
            squaredUV.mulAssign(vec2(
                doorScale,
                1
            ).mul(2))

            const stripes = squaredUV.x.add(squaredUV.y).fract().step(0.5)

            const alpha = baseUv.y.oneMinus().mul(stripes)

            return vec4(doorColor.mul(doorIntensity), alpha)
        })

        const doorGeometry = new THREE.PlaneGeometry(2, 2)

        {
            this.checkpoints.doorTarget = {}
            this.checkpoints.doorTarget.scaleUniform = uniform(2)
            this.checkpoints.doorTarget.color = uniform(color('#32ffc1'))

            const material = new THREE.MeshBasicNodeMaterial({ transparent: true, side: THREE.DoubleSide })
            material.outputNode = doorOutputColor(this.checkpoints.doorTarget.color, this.checkpoints.doorTarget.scaleUniform)

            const mesh = new THREE.Mesh(doorGeometry, material)
            mesh.scale.x = 1
            mesh.castShadow = false
            mesh.receiveShadow = false
            mesh.material = material
            mesh.visible = false
            this.game.scene.add(mesh)

            this.checkpoints.doorTarget.mesh = mesh
        }

        {
            this.checkpoints.doorReached = {}
            this.checkpoints.doorReached.scaleUniform = uniform(2)
            this.checkpoints.doorReached.color = uniform(color('#cbff62'))

            const material = new THREE.MeshBasicNodeMaterial({ transparent: true, side: THREE.DoubleSide })
            material.outputNode = doorOutputColor(this.checkpoints.doorReached.color, this.checkpoints.doorReached.scaleUniform)

            const mesh = new THREE.Mesh(doorGeometry, material)
            mesh.scale.x = 1
            mesh.castShadow = false
            mesh.receiveShadow = false
            mesh.material = material
            mesh.visible = false
            this.game.scene.add(mesh)

            this.checkpoints.doorReached.mesh = mesh
        }
    }

    setResetObjects()
    {
        this.resetObjects = {}
        this.resetObjects.items = []

        const baseObjects = this.references.items.get('objects')

        for(const baseObject of baseObjects)
        {
            this.resetObjects.items.push(baseObject.userData.object)
        }

        this.resetObjects.reset = () =>
        {
            for(const object of this.resetObjects.items)
                this.game.objects.resetObject(object)
        }
    }

    setObstacles()
    {
        this.obstacles = {}
        this.obstacles.items = []

        const baseObstacles = this.references.items.get('obstacles')

        let i = 0
        for(const baseObstacle of baseObstacles)
        {
            const obstacle = {}
            obstacle.object = baseObstacle.userData.object
            obstacle.osciliationOffset = - i * 1
            obstacle.basePosition = obstacle.object.visual.object3D.position.clone()

            this.obstacles.items.push(obstacle)

            i++
        }
    }

    setRoad()
    {
        this.roadBody = this.references.items.get('road')[0].userData.object.physical.body
        this.roadBody.setEnabled(false)
    }

    setRails()
    {
        this.rails = {}

        const railsMesh = this.references.items.get('rails')[0]
        railsMesh.material = railsMesh.material.clone()
        railsMesh.material.side = THREE.DoubleSide

        this.rails.object = railsMesh.userData.object

        this.rails.activate = () =>
        {
            this.game.objects.enable(this.rails.object)
        }

        this.rails.deactivate = () =>
        {
            this.game.objects.disable(this.rails.object)
        }

        this.rails.deactivate()
    }

    setInteractivePoint()
    {
        this.interactivePoint = this.game.interactivePoints.create(
            this.references.items.get('interactivePoint')[0].position,
            '출발!',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                const sound = this.game.audio.groups.get('click')
                if(sound)
                    sound.play(true)

                this.restart()
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

    setStartAnimation()
    {
        this.startAnimation = {}
        this.startAnimation.timeline = gsap.timeline({ paused: true })
        this.startAnimation.interDuration = 2
        this.startAnimation.endCallback = null

        this.startAnimation.timeline.add(() =>
        {
            this.sounds.countdown1.play()
            this.startingLights.mesh.visible = true
            this.startingLights.mesh.position.z = this.startingLights.baseZ + 0.01
        })
        this.startAnimation.timeline.add(gsap.delayedCall(this.startAnimation.interDuration, () =>
        {
            this.sounds.countdown1.play()
            this.startingLights.mesh.position.z = this.startingLights.baseZ + 0.02
        }))
        this.startAnimation.timeline.add(gsap.delayedCall(this.startAnimation.interDuration, () =>
        {
            this.sounds.countdown1.play()
            this.startingLights.mesh.position.z = this.startingLights.baseZ + 0.03
        }))
        this.startAnimation.timeline.add(gsap.delayedCall(this.startAnimation.interDuration, () =>
        {
            this.sounds.countdown2.play()
            this.startingLights.mesh.material = this.startingLights.greenMaterial

            if(typeof this.startAnimation.endCallback === 'function')
                this.startAnimation.endCallback()
        }))
        this.startAnimation.timeline.add(gsap.delayedCall(this.startAnimation.interDuration, () =>
        {
        }))

        this.startAnimation.start = (endCallback) =>
        {
            this.startAnimation.endCallback = endCallback
            this.startAnimation.timeline.seek(0)
            this.startAnimation.timeline.play()
        }
    }

    setRespawn()
    {
        this.game.inputs.addActions([
            { name: 'circuitRestart', categories: [ 'racing' ], keys: [ 'Keyboard.KeyR', 'Gamepad.select' ] },
        ])

        this.game.inputs.events.on('circuitRestart', (action) =>
        {
            if(action.active)
                this.restart()
        })
    }

    respawn()
    {
        if(this.state !== CircuitArea.STATE_RUNNING)
            return

        this.game.player.state = Player.STATE_LOCKED

        const position = new THREE.Vector3()
        let rotation = 0

        if(this.checkpoints.last)
        {
            position.copy(this.checkpoints.last.respawnPosition)
            rotation = this.checkpoints.last.rotation + Math.PI * 0.5
        }
        else
        {
            position.copy(this.startPosition.position)
            rotation = this.startPosition.rotation
        }

        this.game.overlay.show(() =>
        {
            gsap.delayedCall(2, () =>
            {
                this.game.player.state = Player.STATE_DEFAULT
            })

            this.game.physicalVehicle.moveTo(
                position,
                rotation
            )

            this.game.overlay.hide()
        })
    }

    setBounds()
    {
        this.bounds = {}
        this.bounds.threshold = 0
        this.bounds.isOut = false
    }

    setBanners()
    {
        this.banners = this.references.items.get('banners')
    }

    setPodium()
    {
        this.podium = {}
        this.podium.object = this.references.items.get('podium')[0].userData.object
        this.podium.confettiPositionA = this.references.items.get('podiumConfettiA')[0].position.clone()
        this.podium.confettiPositionB = this.references.items.get('podiumConfettiB')[0].position.clone()
        const respawn = this.game.respawns.getByName('circuit')
        this.podium.viewFocusPosition = respawn.position.clone()
        this.podium.viewFocusPosition.x -= 4
        this.podium.viewFocusPosition.y = 0
        this.podium.viewFocusPosition.z -= 3
        this.podium.confettiIndex = 0

        this.podium.popConfetti = () =>
        {
            if(!this.game.world.confetti)
                return

            this.game.world.confetti.pop(this.podium.confettiIndex % 2 === 0 ? this.podium.confettiPositionA : this.podium.confettiPositionB)
            this.podium.confettiIndex++

            if(!this.game.view.focusPoint.isTracking)
            {
                gsap.delayedCall(2 + Math.random() * 3, () =>
                {
                    this.podium.popConfetti()
                })
            }
        }

        this.podium.show = () =>
        {
            this.game.objects.enable(this.podium.object)

            this.game.view.focusPoint.isTracking = false
            this.game.view.focusPoint.position.copy(this.podium.viewFocusPosition)

            this.podium.popConfetti()
        }

        this.podium.hide = () =>
        {
            this.game.objects.disable(this.podium.object)
        }

        this.podium.hide()
    }

    setMenu()
    {
        this.menu = {}
        this.menu.instance = this.game.menu.items.get('circuit')
        const element = this.menu.instance.contentElement
        this.menu.racingButtons = element.querySelector('.js-racing-buttons')
        element.querySelector('.js-button-restart').addEventListener('click', () => { this.restart(); this.game.menu.close() })
        element.querySelector('.js-button-end').addEventListener('click', () =>
        {
            if(this.state === CircuitArea.STATE_RUNNING || this.state === CircuitArea.STATE_STARTING) this.finish(true)
            this.game.menu.close()
        })
        element.querySelector('.js-button-controls').addEventListener('click', () => this.game.menu.open('controls'))
    }

    setCourseSign()
    {
        const reset = this.references.items.get('leaderboardReset')[0]
        const title = this.objects.items.find(item => item.visual?.object3D?.name === 'Text002')
        if(title) title.visual.object3D.geometry.setDrawRange(0, 0)

        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 512
        const context = canvas.getContext('2d')
        context.fillStyle = '#ede7d6'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.font = '700 64px MaruBuri'
        context.fillText('서킷', 256, 135)
        context.font = '400 28px MaruBuri'
        context.fillText('8개의 체크포인트를 따라', 256, 240, 440)
        context.fillText('한 바퀴 달려보세요', 256, 290, 440)
        context.fillText('출발선에서 시작할 수 있어요', 256, 400, 440)
        const map = new THREE.CanvasTexture(canvas)
        map.colorSpace = THREE.SRGBColorSpace
        const material = new MeshDefaultMaterial({ colorNode: color('#463f35'), hasWater: false })
        const baseOutput = material.outputNode
        const ink = texture(map, uv(1))
        material.outputNode = vec4(mix(baseOutput.rgb, ink.rgb, ink.a), baseOutput.a)
        this.references.items.get('leaderboard')[0].material = material

        const resetCanvas = document.createElement('canvas')
        resetCanvas.width = 256
        resetCanvas.height = 64
        const resetContext = resetCanvas.getContext('2d')
        resetContext.fillStyle = '#ede7d6'
        resetContext.textAlign = 'center'
        resetContext.textBaseline = 'middle'
        resetContext.font = '700 32px MaruBuri'
        resetContext.fillText('장애물', 128, 32)
        const resetMap = new THREE.CanvasTexture(resetCanvas)
        resetMap.colorSpace = THREE.SRGBColorSpace
        const resetMaterial = new MeshDefaultMaterial({ colorNode: color('#463f35'), hasWater: false })
        const resetBase = resetMaterial.outputNode
        const resetInk = texture(resetMap, uv(1))
        resetMaterial.outputNode = vec4(mix(resetBase.rgb, resetInk.rgb, resetInk.a), resetBase.a)
        reset.material = resetMaterial
        this.game.interactivePoints.create(
            reset.position.clone().add(new THREE.Vector3(0, 1, 0)),
            '장애물 다시 놓기',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () => this.resetObjects.reset(),
            () => this.game.inputs.interactiveButtons.addItems(['interact']),
            () => this.game.inputs.interactiveButtons.removeItems(['interact']),
            () => this.game.inputs.interactiveButtons.removeItems(['interact'])
        )
    }

    setEndModal()
    {
        this.endModal = {}
        this.endModal.instance = this.game.modals.items.get('circuit-end')
        this.endModal.timeElement = this.endModal.instance.element.querySelector('.js-time')
        this.endModal.instance.element.querySelector('.js-button-restart').addEventListener('click', () =>
        {
            this.restart()
            this.game.modals.close()
        })
    }

    restart()
    {
        if(this.state === CircuitArea.STATE_STARTING)
            return

        this.frustum.alwaysVisible = true

        this.timer.end()

        this.state = CircuitArea.STATE_STARTING

        this.interactivePoint.hide()

        this.game.player.state = Player.STATE_LOCKED

        this.game.inputs.filters.clear()
        this.game.inputs.filters.add('racing')

        this.startAnimation.timeline.pause()

        this.game.overlay.show(() =>
        {
            this.menu.racingButtons.classList.add('is-active')

            this.game.physicalVehicle.moveTo(
                this.startPosition.position,
                this.startPosition.rotation
            )

            if(this.game.world.floor)
                this.game.world.floor.physical.body.setEnabled(false)

            this.roadBody.setEnabled(true)

            this.startingLights.reset()

            this.checkpoints.doorReached.mesh.visible = false
            this.checkpoints.doorTarget.mesh.visible = false

            this.checkpoints.items[0].setTarget()

            this.checkpoints.reachedCount = 0
            this.checkpoints.last = null

            this.checkpoints.timings = []

            this.resetObjects.reset()

            this.game.world.explosiveCrates.reset()

            this.game.weather.override.start(
                {
                    humidity: 0,
                    electricField: 0,
                    clouds: 0,
                    wind: 0
                },
                0
            )

            this.game.dayCycles.override.start(
                {
                    progress: 0.85,
                    fogNearRatio: 0.65,
                    fogFarRatio: 1.25
                },
                0
            )

            this.timer.show()

            this.rails.activate()

            this.podium.hide()

            this.game.overlay.hide(() =>
            {
                this.state = CircuitArea.STATE_RUNNING

                this.startAnimation.start(() =>
                {
                    this.game.player.state = Player.STATE_DEFAULT

                    this.timer.start()
                })
            })
        })
    }

    finish(forced = false)
    {
        if(this.state !== CircuitArea.STATE_RUNNING)
            return

        this.state = CircuitArea.STATE_ENDING

        this.timer.end()
        if(forced)
            this.timer.hide()

        this.checkpoints.target = null
        this.checkpoints.doorTarget.mesh.visible = false

        if(!forced)
        {
            this.sounds.finish.play()
        }

        gsap.delayedCall(forced ? 1 : 4, () =>
        {
            this.game.overlay.show(() =>
            {
                this.state = CircuitArea.STATE_PENDING

                this.frustum.alwaysVisible = false

                this.menu.racingButtons.classList.remove('is-active')

                this.interactivePoint.show()

                this.game.inputs.filters.clear()
                this.game.inputs.filters.add('wandering')

                const respawn = this.game.respawns.getByName('circuit')
                this.game.physicalVehicle.moveTo(respawn.position, respawn.rotation)

                if(this.game.world.floor)
                    this.game.world.floor.physical.body.setEnabled(true)

                this.roadBody.setEnabled(false)

                this.game.weather.override.end(0)
                this.game.dayCycles.override.end(0)

                this.checkpoints.doorReached.mesh.visible = false
                this.checkpoints.doorTarget.mesh.visible = false

                this.startingLights.reset()

                this.rails.deactivate()

                this.game.world.explosiveCrates.reset()

                if(!forced)
                    this.podium.show()

                if(!forced)
                {
                    gsap.delayedCall(2, () =>
                    {
                        this.sounds.applause.play()
                    })
                }

                if(!forced)
                    gsap.delayedCall(1, () => this.game.modals.open('circuit-end'))

                this.game.overlay.hide(() =>
                {
                    this.state = CircuitArea.STATE_PENDING
                })
            })
        })
    }

    update()
    {
        if(this.state === CircuitArea.STATE_RUNNING)
        {
            for(const checkpoint of this.checkpoints.items)
            {
                const intersections = segmentCircleIntersection(
                    checkpoint.a.x,
                    checkpoint.a.y,
                    checkpoint.b.x,
                    checkpoint.b.y,
                    this.game.player.position2.x,
                    this.game.player.position2.y,
                    this.checkpoints.checkRadius
                )

                if(intersections.length)
                    checkpoint.reach()
            }

            for(const obstacle of this.obstacles.items)
            {
                const newPosition = obstacle.basePosition.clone()
                const osciliation = Math.sin(this.timer.elapsedTime * 1.25 + obstacle.osciliationOffset) * 5
                newPosition.z += osciliation

                obstacle.object.physical.body.setNextKinematicTranslation(newPosition)
                obstacle.object.needsUpdate = true
            }

            if(this.game.player.position.y < this.bounds.threshold)
            {
                if(!this.bounds.isOut)
                {
                    this.bounds.isOut = true
                    this.respawn()
                }
            }
            else
            {
                this.bounds.isOut = false
            }
        }

        let i = 0
        for(const banner of this.banners)
        {
            const time = this.game.wind.localTime.value * 10 + i * 0.5
            const rotation = Math.sin(time) + Math.sin(time * 2.34) * 0.5 + Math.sin(time * 3.45) * 0.25
            banner.rotation.y = 0.5 + rotation * 0.5

            i++
        }

        this.timer.update()
    }
}
