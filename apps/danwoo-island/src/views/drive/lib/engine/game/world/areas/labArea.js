import * as THREE from 'three/webgpu'
import { rebuildVillageProps } from '../islandVillage'
import { rebuildLabGate } from '../islandStructures'
import { getGame } from '../../gameContext'
import { InteractivePoints } from '../../interactivePoints'
import gsap from 'gsap'
import labData from '../../../data/lab'
import content from '../../../data/danwoo'
import { TextCanvas } from '../../textCanvas'
import { add, color, float, Fn, If, luminance, mix, mul, normalWorld, positionGeometry, positionWorld, sin, step, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { remapClamp, safeMod, signedModDelta } from '../../utilities/maths'
import { Inputs } from '../../inputs/inputs'
import { MeshDefaultMaterial } from '../../materials/meshDefaultMaterial'
import { Area } from './area'

const ROPE_COLOR = '#a8814a'
const HERBAL_BREW = { center: '#ffb347', rim: '#c2410c', intensity: 1.2 }

export class LabArea extends Area
{
    setObjects()
    {
        rebuildVillageProps(this.model, this.game.materials)
        rebuildLabGate(this.model, this.game.materials)
        super.setObjects()
    }

    static DIRECTION_PREVIOUS = 1
    static DIRECTION_NEXT = 2
    static STATE_OPEN = 3
    static STATE_OPENING = 4
    static STATE_CLOSED = 5
    static STATE_CLOSING = 6

    constructor(model)
    {
        super(model)

        this.state = LabArea.STATE_CLOSED

        this.setSounds()
        this.setInteractivePoint()
        this.setInputs()
        this.setCinematic()
        this.setShadeMix()
        this.setTexts()
        this.setHover()
        this.setNavigation()
        this.setImages()
        this.setAdjacents()
        this.setTitle()
        this.setUrl()
        this.setScroller()
        this.setPendulum()
        this.setBlackBoard()
        this.setCandleFlames()
        this.setCauldron()

        this.changeProject(0, null, true)
        this.scroller.progress = this.scroller.targetProgress

        this.scroller.animate()
    }

    setSounds()
    {
        this.sounds = {}

        this.sounds.scroll = this.game.audio.register({
            path: 'sounds/mecanism/05947 light wooden cart riding on cobblestone - looping.mp3',
            autoplay: true,
            loop: true,
            volume: 0.5,
            positions: this.references.items.get('mecanism')[0].position,
            onPlaying: (item) =>
            {
                const absoluteSpeed = Math.abs(this.scroller.speed)
                item.volume = remapClamp(absoluteSpeed, [0, 6], [0, 0.5])
                item.rate = remapClamp(absoluteSpeed, [0, 6], [0.95, 1.05])
            }
        })
    }

    setInteractivePoint()
    {
        this.interactivePoint = this.game.interactivePoints.create(
            this.references.items.get('interactivePoint')[0].position,
            'Danwoo Lab',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                window.open(content.labUrl, '_blank', 'noopener,noreferrer')
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

    setInputs()
    {
        this.game.inputs.events.on('left', (action) =>
        {
            if(action.active)
                this.previous()
        })

        this.game.inputs.events.on('right', (action) =>
        {
            if(action.active)
                this.next()
        })

        this.game.inputs.events.on('forward', (action) =>
        {
            if(action.active && !action.activeKeys.has('Gamepad.r2'))
                this.previous()
        })

        this.game.inputs.events.on('backward', (action) =>
        {
            if(action.active && !action.activeKeys.has('Gamepad.l2'))
                this.next()
        })

        this.game.inputs.events.on('interact', (action) =>
        {
            if(!action.active && this.state === LabArea.STATE_OPEN)
                this.url.open()
        })

        this.game.inputs.interactiveButtons.events.on('previous', () =>
        {
            if(this.state === LabArea.STATE_OPEN)
                this.previous()
        })

        this.game.inputs.interactiveButtons.events.on('next', () =>
        {
            if(this.state === LabArea.STATE_OPEN)
                this.next()
        })

        this.game.inputs.interactiveButtons.events.on('open', () =>
        {
            if(this.state === LabArea.STATE_OPEN)
                this.url.open()
        })

        this.game.inputs.interactiveButtons.events.on('close', () =>
        {
            if(this.state === LabArea.STATE_OPEN)
                this.close()
        })
    }

    setCinematic()
    {
        this.cinematic = {}

        this.cinematic.position = new THREE.Vector3()
        this.cinematic.positionOffset = new THREE.Vector3(4.35, 4.0, 4)

        this.cinematic.target = new THREE.Vector3()
        this.cinematic.targetOffset = new THREE.Vector3(-1.75, 1.9, -3)

        const applyPositionAndTarget = () =>
        {
            const flatPosition = this.references.items.get('interactivePoint')[0].position.clone()
            flatPosition.y = 0
            this.cinematic.position.copy(flatPosition).add(this.cinematic.positionOffset)
            this.cinematic.target.copy(flatPosition).add(this.cinematic.targetOffset)
        }
        applyPositionAndTarget()
    }

    setShadeMix()
    {
        this.shadeMix = {}

        this.shadeMix.images = {}
        this.shadeMix.images.min = 0.1
        this.shadeMix.images.max = 0.65
        this.shadeMix.images.mixUniform = uniform(this.shadeMix.images.min)

        this.shadeMix.texts = {}
        this.shadeMix.texts.min = 0.1
        this.shadeMix.texts.max = 0.3
        this.shadeMix.texts.mixUniform = uniform(this.shadeMix.texts.min)
    }

    setTexts()
    {
        this.texts = {}

        this.texts.density = 200
        this.texts.fontFamily = 'MaruBuri'
        this.texts.fontWeight = 700
        this.texts.fontSizeMultiplier = 1
        this.texts.baseColor = color('#ffffff')

        this.texts.createMaterialOnMesh = (mesh, textTexture) =>
        {
            const material = new MeshDefaultMaterial({
                hasWater: false,
                alphaNode: texture(textTexture).r,
                transparent: true
            })

            const baseOutput = material.outputNode

            material.outputNode = Fn(() =>
            {
                return vec4(
                    mix(
                        baseOutput.rgb,
                        this.texts.baseColor,
                        this.shadeMix.texts.mixUniform
                    ),
                    baseOutput.a
                )
            })()

            mesh.castShadow = false
            mesh.receiveShadow = false
            mesh.material = material
        }
    }

    setHover()
    {
        this.hover = {}
        this.hover.baseColor = color('#ffffff')

        this.hover.inactiveMaterial = new MeshDefaultMaterial({
            colorNode: this.hover.baseColor,
            hasWater: false
        })

        const baseOutput = this.hover.inactiveMaterial.outputNode

        this.hover.inactiveMaterial.outputNode = Fn(() =>
        {
            return vec4(
                mix(
                    baseOutput.rgb,
                    this.texts.baseColor,
                    this.shadeMix.texts.mixUniform
                ),
                1
            )
        })()

        this.hover.activeMaterial = new THREE.MeshBasicNodeMaterial({ transparent: true })
        this.hover.activeMaterial.outputNode = vec4(this.hover.baseColor.mul(1.5), float(1))
    }

    setNavigation()
    {
        this.navigation = {}
        this.navigation.index = -1
        this.navigation.current = null
        this.navigation.next = null
        this.navigation.previous = null
        this.navigation.direction = LabArea.DIRECTION_NEXT
    }

    setImages()
    {
        this.images = {}
        this.images.initiated = false
        this.images.width = 1920 * 0.5
        this.images.height = 1080 * 0.5
        this.images.resources = new Map()
        this.images.loadProgress = uniform(0)
        this.images.animationProgress = uniform(0)
        this.images.animationDirection = uniform(0)

        this.images.mesh = this.references.items.get('images')[0]
        this.images.mesh.receiveShadow = true
        this.images.mesh.castShadow = false
        this.images.mesh.visible = false

        this.images.init = (key) =>
        {
            this.images.initiated = true

            this.images.mesh.visible = true
            const resource = this.images.resources.get(key)

            this.images.textureOld = resource.texture.clone()
            this.images.textureNew = resource.texture.clone()

            const colorNode = Fn(() =>
            {
                const uvOld = uv().toVar()
                const uvNew = uv().toVar()

                uvNew.x.addAssign(this.images.animationProgress.oneMinus().mul(-0.25).mul(this.images.animationDirection))
                uvOld.x.addAssign(this.images.animationProgress.mul(0.25).mul(this.images.animationDirection))

                const textureOldColor = texture(this.images.textureOld, uvOld).rgb
                const textureNewColor = texture(this.images.textureNew, uvNew).rgb

                textureNewColor.assign(mix(color('#333333'), textureNewColor, this.images.loadProgress))

                const reveal = uv().x.toVar()
                If(this.images.animationDirection.greaterThan(0), () =>
                {
                    reveal.assign(reveal.oneMinus())
                })
                const threshold = step(this.images.animationProgress, reveal)

                const textureColor = mix(textureNewColor, textureOldColor, threshold)
                return textureColor
            })()

            this.images.material = new MeshDefaultMaterial({
                colorNode: colorNode,
                hasWater: false
            })

            const baseOutput = this.images.material.outputNode

            this.images.material.outputNode = Fn(() =>
            {
                return vec4(
                    mix(
                        baseOutput.rgb,
                        colorNode,
                        this.shadeMix.images.mixUniform
                    ),
                    baseOutput.a
                )
            })()

            this.images.mesh.material = this.images.material
        }

        this.images.loadEnded = (key) =>
        {
            if(!this.images.initiated)
                this.images.init(key)

            if(this.navigation.current.image === key)
            {
                const resource = this.images.getResourceAndLoad(key)
                this.images.textureNew.copy(resource.texture)
                this.images.textureNew.needsUpdate = true
                gsap.to(this.images.loadProgress, { value: 1, duration: 1, overwrite: true })

                this.images.loadSibling()
            }
        }

        this.images.loadSibling = () =>
        {
            let projectIndex = this.navigation.index

            if(this.navigation.direction === LabArea.DIRECTION_PREVIOUS)
                projectIndex -= 1
            else
                projectIndex += 1

            if(projectIndex < 0)
                projectIndex = labData.length - 1

            if(projectIndex > labData.length - 1)
                projectIndex = 0

            const key = labData[projectIndex].image
            const resource = this.images.getResourceAndLoad(key)
        }

        this.images.getResourceAndLoad = (key) =>
        {
            const path = `danwoo/${key}`

            let resource = this.images.resources.get(key)

            if(!resource)
            {
                resource = {}
                resource.loaded = false

                const loader = new THREE.TextureLoader()

                loader.load(
                    path,
                    (loadedTexture) =>
                    {
                        resource.texture = loadedTexture
                        loadedTexture.colorSpace = THREE.SRGBColorSpace
                        loadedTexture.flipY = false
                        loadedTexture.magFilter = THREE.LinearFilter
                        loadedTexture.minFilter = THREE.LinearFilter
                        loadedTexture.generateMipmaps = false

                        resource.loaded = true

                        this.images.loadEnded(key)
                    }
                )

                this.images.resources.set(key, resource)
            }

            return resource
        }

        this.images.update = () =>
        {
            const key = this.navigation.current.image
            const resource = this.images.getResourceAndLoad(key)

            if(resource.loaded)
            {
                this.images.loadSibling()
                this.images.loadProgress.value = 1
            }
            else
            {
                this.images.loadProgress.value = 0
            }

            if(this.images.initiated)
            {
                this.images.textureOld.copy(this.images.textureNew)
                this.images.textureOld.needsUpdate = true

                if(resource.loaded)
                {
                    this.images.textureNew.copy(resource.texture)
                    this.images.textureNew.needsUpdate = true
                }
            }

            gsap.fromTo(this.images.animationProgress, { value: 0 }, { value: 1, duration: 1, ease: 'power2.inOut', overwrite: true })
            this.images.animationDirection.value = this.navigation.direction === LabArea.DIRECTION_NEXT ? 1 : -1
        }
    }

    setAdjacents()
    {
        this.adjacents = {}

        const arrowPrevious = this.references.items.get('arrowPrevious')[0]
        arrowPrevious.material = this.hover.inactiveMaterial

        const intersectPrevious = this.references.items.get('intersectPrevious')[0]
        const intersectPreviousPosition = new THREE.Vector3()
        intersectPrevious.getWorldPosition(intersectPreviousPosition)

        this.adjacents.previousIntersect = this.game.rayCursor.addIntersect({
            active: false,
            shape: new THREE.Sphere(intersectPreviousPosition, intersectPrevious.scale.x),
            onClick: () =>
            {
                this.previous(true)
            },
            onEnter: () =>
            {
                arrowPrevious.material = this.hover.activeMaterial
            },
            onLeave: () =>
            {
                arrowPrevious.material = this.hover.inactiveMaterial
            }
        })

        const arrowNext = this.references.items.get('arrowNext')[0]
        arrowNext.material = this.hover.inactiveMaterial

        const intersectNext = this.references.items.get('intersectNext')[0]

        const intersectNextPosition = new THREE.Vector3()
        intersectNext.getWorldPosition(intersectNextPosition)

        this.adjacents.nextIntersect = this.game.rayCursor.addIntersect({
            active: false,
            shape: new THREE.Sphere(intersectNextPosition, intersectNext.scale.x),
            onClick: () =>
            {
                this.next()
            },
            onEnter: () =>
            {
                arrowNext.material = this.hover.activeMaterial
            },
            onLeave: () =>
            {
                arrowNext.material = this.hover.inactiveMaterial
            }
        })
    }

    setTitle()
    {
        this.title = {}
        this.title.status = 'hidden'
        this.title.group = this.references.items.get('title')[0]
        this.title.inner = this.title.group.children[0]
        this.title.textMesh = this.title.inner.children.find(_child => _child.name.startsWith('text'))
        this.title.textCanvas = new TextCanvas(
            this.texts.fontFamily,
            this.texts.fontWeight,
            this.texts.fontSizeMultiplier * 0.4,
            4,
            0.6,
            this.texts.density,
            'center'
        )
        this.texts.createMaterialOnMesh(this.title.textMesh, this.title.textCanvas.texture)

        this.title.update = (direction) =>
        {
            if(this.title.status === 'hiding')
                return

            this.title.status = 'hiding'

            const rotationDirection = direction === LabArea.DIRECTION_NEXT ? - 1 : 1

            this.title.inner.rotation.x = 0
            gsap.to(this.title.inner.rotation, { x: Math.PI * rotationDirection, duration: 1, delay: 0, ease: 'power2.in', overwrite: true, onComplete: () =>
            {
                this.title.status = 'visible'

                gsap.to(this.title.inner.rotation, { x: Math.PI * 2 * rotationDirection, duration: 1, delay: 0, ease: 'back.out(2)', overwrite: true })

                this.title.textCanvas.updateText(this.navigation.current.title)
            } })
        }
    }

    setUrl()
    {
        this.url = {}
        this.url.status = 'hidden'
        this.url.group = this.references.items.get('url')[0]
        this.url.inner = this.url.group.children[0]

        this.url.textMesh = this.url.inner.children.find(_child => _child.name.startsWith('text'))
        this.url.panel = this.url.inner.children.find(_child => _child.name.startsWith('panel'))
        this.url.textCanvas = new TextCanvas(
            this.texts.fontFamily,
            this.texts.fontWeight,
            this.texts.fontSizeMultiplier * 0.23,
            4,
            0.2,
            this.texts.density,
            'center'
        )
        this.url.mixStrength = uniform(0)

        const material = new MeshDefaultMaterial({
            colorNode: this.texts.baseColor,
            hasWater: false,
            alphaNode: texture(this.url.textCanvas.texture).r,
            transparent: true
        })

        const baseOutput = material.outputNode

        material.outputNode = Fn(() =>
        {
            return vec4(
                mix(
                    mix(
                        baseOutput.rgb,
                        this.texts.baseColor,
                        this.shadeMix.texts.mixUniform
                    ),
                    this.texts.baseColor.mul(1.5),
                    this.url.mixStrength
                ),
                baseOutput.a
            )
        })()

        this.url.textMesh.castShadow = false
        this.url.textMesh.receiveShadow = false
        this.url.textMesh.material = material

        const intersect = this.references.items.get('intersectUrl')[0]
        intersect.visible = false

        this.url.intersect = this.game.rayCursor.addIntersect({
            active: false,
            shape: intersect,
            onClick: () =>
            {
                this.url.open()
            },
            onEnter: () =>
            {
                this.url.mixStrength.value = 1
            },
            onLeave: () =>
            {
                this.url.mixStrength.value = 0
            }
        })

        this.url.update = (direction) =>
        {
            if(this.url.status === 'hiding')
                return

            this.url.status = 'hiding'

            const rotationDirection = direction === LabArea.DIRECTION_NEXT ? - 1 : 1

            this.url.inner.rotation.x = 0
            gsap.to(this.url.inner.rotation, { x: Math.PI * rotationDirection, duration: 1, delay: 0.3, ease: 'power2.in', overwrite: true, onComplete: () =>
            {
                this.url.status = 'visible'

                gsap.to(this.url.inner.rotation, { x: Math.PI * 2 * rotationDirection, duration: 1, delay: 0, ease: 'back.out(2)', overwrite: true })

                this.url.textCanvas.updateText(this.navigation.current.url.replace(/https?:\/\//, ''))

                const ratio = this.url.textCanvas.getMeasure().width / this.texts.density
                this.url.panel.scale.x = ratio + 0.2
            } })
        }

        this.url.open = () =>
        {
            if(this.navigation.current.url)
            {
                window.open(this.navigation.current.url, '_blank', 'noopener,noreferrer')
            }
        }
    }

    setScroller()
    {
        this.scroller = {}
        this.scroller.repeatAmplitude = 0.5444
        this.scroller.chainLeft = this.references.items.get('chainLeft')[0]
        this.scroller.chainRight = this.references.items.get('chainRight')[0]
        this.scroller.chainPulley = this.references.items.get('chainPulley')[0]
        this.scroller.gearA = this.references.items.get('gearA')[0]
        this.scroller.gearB = this.references.items.get('gearB')[0]
        this.scroller.gearC = this.references.items.get('gearC')[0]
        this.scroller.progress = 0
        this.scroller.offset = 0
        this.scroller.targetProgress = 0
        this.scroller.wheelSensitivity = 0.1
        this.scroller.easing = 3
        this.scroller.speed = 0

        {
            const material = new MeshDefaultMaterial({
                colorNode: color(ROPE_COLOR),
                alphaNode: positionWorld.y.step(4).oneMinus(),
                hasWater: false,
                hasLightBounce: false
            })

            this.scroller.chainLeft.material = material
            this.scroller.chainRight.material = material
        }

        {
            const material = new MeshDefaultMaterial({
                colorNode: color(ROPE_COLOR),
                alphaNode: positionWorld.y.step(4),
                hasWater: false,
                hasLightBounce: false
            })

            this.scroller.chainPulley.material = material
        }

        {
            const groupTemplate = this.references.items.get('mini')[0]
            const parent = groupTemplate.parent
            groupTemplate.removeFromParent()

            this.scroller.minis = {}
            this.scroller.minis.inter = 0.9
            this.scroller.minis.items = []
            this.scroller.minis.total = labData.length * this.scroller.minis.inter
            this.scroller.minis.current = null
            this.scroller.minis.width = 1920 / 8
            this.scroller.minis.height = 1080 / 8

            let i = 0
            for(const project of labData)
            {
                const mini = {}
                mini.index = i
                mini.y = - i * this.scroller.minis.inter
                this.scroller.minis.items.push(mini)

                mini.group = groupTemplate.clone(true)
                mini.group.position.y = mini.y
                mini.group.visible = true
                parent.add(mini.group)

                let imageMesh = null
                let textMesh = null
                let panelMesh = null
                let intersectMesh = null

                for(const child of mini.group.children)
                {
                    if(child.name.startsWith('image'))
                        imageMesh = child
                    if(child.name.startsWith('text'))
                        textMesh = child
                    if(child.name.startsWith('panel'))
                        panelMesh = child
                    if(child.name.startsWith('intersect'))
                        intersectMesh = child
                }

                {
                    imageMesh.visible = false

                    mini.startedLoading = false
                    mini.startLoading = () =>
                    {
                        if(mini.startedLoading)
                            return

                        const loader = new THREE.TextureLoader()

                        loader.load(
                            `danwoo/${project.imageMini}`,
                            (loadedTexture) =>
                            {
                                const alpha = uniform(0)
                                const textureColor = texture(loadedTexture).rgb
                                gsap.to(alpha, { value: 1, duration: 1, overwrite: true })

                                loadedTexture.colorSpace = THREE.SRGBColorSpace
                                loadedTexture.flipY = false
                                loadedTexture.magFilter = THREE.LinearFilter
                                loadedTexture.minFilter = THREE.LinearFilter
                                loadedTexture.generateMipmaps = false

                                const material = new MeshDefaultMaterial({
                                    colorNode: textureColor,
                                    hasWater: false,
                                    hasLightBounce: false,
                                    transparent: true
                                })

                                const baseOutput = material.outputNode

                                material.outputNode = Fn(() =>
                                {
                                    return vec4(
                                        mix(
                                            baseOutput.rgb,
                                            textureColor,
                                            this.shadeMix.images.mixUniform
                                        ),
                                        alpha
                                    )
                                })()

                                imageMesh.material = material
                                imageMesh.visible = true
                            }
                        )

                        mini.startedLoading = true
                    }
                }

                {
                    mini.textMixStrength = uniform(0)

                    const textCanvas = new TextCanvas(
                        this.texts.fontFamily,
                        this.texts.fontWeight,
                        this.texts.fontSizeMultiplier * 0.18,
                        1.5,
                        0.2,
                        this.texts.density,
                        'center',
                        0.2
                    )
                    textCanvas.updateText(project.title)

                    const ratio = textCanvas.getMeasure().width / this.texts.density
                    panelMesh.scale.x = ratio + 0.2

                    const material = new MeshDefaultMaterial({
                        colorNode: this.texts.baseColor,
                        hasWater: false,
                        hasLightBounce: false,
                        alphaNode: texture(textCanvas.texture).r,
                        transparent: true
                    })

                    const baseOutput = material.outputNode

                    material.outputNode = Fn(() =>
                    {
                        return vec4(
                            mix(
                                mix(
                                    baseOutput.rgb,
                                    this.texts.baseColor,
                                    this.shadeMix.texts.mixUniform
                                ),
                                this.texts.baseColor.mul(1.5),
                                mini.textMixStrength
                            ),
                            baseOutput.a
                        )
                    })()

                    textMesh.castShadow = false
                    textMesh.receiveShadow = false
                    textMesh.material = material
                }

                intersectMesh.visible = false
                mini.intersect = this.game.rayCursor.addIntersect({
                    active: false,
                    shape: intersectMesh,
                    onClick: () =>
                    {
                        this.changeProject(mini.index)
                    },
                    onEnter: () =>
                    {
                        mini.textMixStrength.value = 1
                    },
                    onLeave: () =>
                    {
                        if(mini.index === this.navigation.index)
                            mini.textMixStrength.value = 1
                        else
                            mini.textMixStrength.value = 0
                    }
                })

                i++
            }
        }

        this.scroller.gearA.rotation.reorder('YXZ')
        this.scroller.gearB.rotation.reorder('YXZ')
        this.scroller.gearC.rotation.reorder('YXZ')

        this.scroller.animate = () =>
        {
            const delta = (this.scroller.targetProgress - this.scroller.progress) * this.game.ticker.deltaScaled * this.scroller.easing
            this.scroller.progress += delta
            this.scroller.offset = this.scroller.progress * this.scroller.minis.inter

            this.scroller.speed = delta / this.game.ticker.delta

            this.scroller.chainLeft.position.y = - this.scroller.repeatAmplitude * 0.5 - this.scroller.offset % this.scroller.repeatAmplitude
            this.scroller.chainRight.position.y = - this.scroller.repeatAmplitude * 0.5 + (this.scroller.offset % this.scroller.repeatAmplitude)
            this.scroller.chainPulley.rotation.z = this.scroller.offset * 1.4

            this.scroller.gearA.rotation.x = - this.scroller.offset * 1.4
            this.scroller.gearB.rotation.x = - this.scroller.gearA.rotation.x * (6 / 12)
            this.scroller.gearC.rotation.x = - this.scroller.gearB.rotation.x * (6 / 12)

            for(const mini of this.scroller.minis.items)
            {
                mini.group.position.y = safeMod(mini.y - this.scroller.offset, this.scroller.minis.total) - 1

                const scale = remapClamp(mini.group.position.y, [3.3, 3.9], [1, 0])
                mini.group.scale.y = scale

                mini.group.visible = scale > 0
                mini.intersect.active = mini.group.visible && (this.state === LabArea.STATE_OPEN || this.state === LabArea.STATE_OPENING)

                if(mini.group.visible && !mini.startedLoading)
                {
                    mini.startLoading()
                }
            }
        }

        this.scroller.update = () =>
        {
            const centeringOffset = labData.length - 3.25
            const closestProgress = Math.round((this.scroller.progress + this.navigation.index - centeringOffset) / labData.length) * labData.length - this.navigation.index + centeringOffset
            this.scroller.targetProgress = closestProgress

            if(this.scroller.minis.current)
                this.scroller.minis.current.textMixStrength.value = 0

            const mini = this.scroller.minis.items[this.navigation.index]
            mini.textMixStrength.value = 1
            this.scroller.minis.current = mini
        }

        this.game.inputs.addActions([
            { name: 'labScroll', categories: [ 'cinematic' ], keys: [ 'Wheel.roll' ] }
        ])

        this.game.inputs.events.on('labScroll', (action) =>
        {
            this.scroller.targetProgress -= action.value * this.scroller.wheelSensitivity
        })
    }

    setPendulum()
    {
        this.references.items.get('balls')[0].rotation.reorder('YXZ')
        const timeline0 = gsap.timeline({ yoyo: true, repeat: -1 })
        timeline0.to(this.references.items.get('balls')[0].rotation, { x: 0.75, ease: 'power2.out', delay: 0.75, duration: 0.75 })

        const timeline1 = gsap.timeline({ yoyo: true, repeat: -1, delay: 1.5 })
        timeline1.to(this.references.items.get('balls')[1].rotation, { x: -0.75, ease: 'power2.out', delay: 0.75, duration: 0.75 })
    }

    setBlackBoard()
    {
        this.blackBoard = {}
        this.blackBoard.active = true
        this.blackBoard.group = this.references.items.get('blackBoard')[0]
        this.blackBoard.parent = this.blackBoard.group.parent

        this.blackBoard.timeline = gsap.timeline({
            repeat: -1,
            repeatDelay: 5,
            paused: true,
            onRepeat: () =>
            {
                if(this.state === LabArea.STATE_CLOSED || this.state === LabArea.STATE_CLOSING || !this.blackBoard.active)
                    this.blackBoard.timeline.pause()
            }
        })

        this.blackBoard.timeline.to(this.blackBoard.group.position, { y: 0.25, ease: 'power2.out', duration: 0.7 }, 0 + 2)
        this.blackBoard.timeline.to(this.blackBoard.group.position, { y: 0, ease: 'power2.in', duration: 0.7 }, 0.7 + 2)

        this.blackBoard.timeline.to(this.blackBoard.group.rotation, { x: 0.1, duration: 0.15 }, 0 + 2)
        this.blackBoard.timeline.to(this.blackBoard.group.rotation, { x: -0.1, duration: 0.3 }, 0.15 + 2)
        this.blackBoard.timeline.to(this.blackBoard.group.rotation, { x: 0.1, duration: 0.3 }, 0.45 + 2)
        this.blackBoard.timeline.to(this.blackBoard.group.rotation, { x: -0.1, duration: 0.3 }, 0.75 + 2)
        this.blackBoard.timeline.to(this.blackBoard.group.rotation, { x: 0, duration: 0.3 }, 1.05 + 2)

        this.blackBoard.labelsGamepadPlaystation = this.references.items.get('blackboardLabelsGamepadPlaystation')[0]
        this.blackBoard.labelsGamepadXbox = this.references.items.get('blackboardLabelsGamepadXbox')[0]
        this.blackBoard.labelsMouseKeyboard = this.references.items.get('blackboardLabelsMouseKeyboard')[0]
        this.blackBoard.labelsGamepadPlaystation.castShadow = false
        this.blackBoard.labelsGamepadXbox.castShadow = false
        this.blackBoard.labelsMouseKeyboard.castShadow = false
        this.blackBoard.labelsGamepadPlaystation.visible = false
        this.blackBoard.labelsGamepadXbox.visible = false

        this.game.inputs.modeEvents.on('change', () =>
        {
            if(this.game.inputs.mode === Inputs.MODE_GAMEPAD)
            {
                if(this.game.inputs.gamepad.type === 'xbox')
                {
                    this.blackBoard.labelsGamepadXbox.visible = true
                    this.blackBoard.labelsGamepadPlaystation.visible = false
                }
                else
                {
                    this.blackBoard.labelsGamepadXbox.visible = false
                    this.blackBoard.labelsGamepadPlaystation.visible = true
                }
                this.blackBoard.labelsMouseKeyboard.visible = false

                this.blackBoard.parent.add(this.blackBoard.group)
            }
            else if(this.game.inputs.mode === Inputs.MODE_MOUSEKEYBOARD)
            {
                this.blackBoard.labelsGamepadXbox.visible = false
                this.blackBoard.labelsGamepadPlaystation.visible = false
                this.blackBoard.labelsMouseKeyboard.visible = true
                this.blackBoard.parent.add(this.blackBoard.group)
            }
            else if(this.game.inputs.mode === Inputs.MODE_TOUCH)
            {
                this.blackBoard.parent.remove(this.blackBoard.group)
            }
        })

        this.game.inputs.gamepad.events.on('typeChange', () =>
        {
            if(this.game.inputs.mode === Inputs.MODE_GAMEPAD)
            {
                if(this.game.inputs.gamepad.type === 'xbox')
                {
                    this.blackBoard.labelsGamepadXbox.visible = true
                    this.blackBoard.labelsGamepadPlaystation.visible = false
                }
                else
                {
                    this.blackBoard.labelsGamepadXbox.visible = false
                    this.blackBoard.labelsGamepadPlaystation.visible = true
                }
            }
        })
    }

    setCandleFlames()
    {
        const meshes = this.references.items.get('candleFlame')

        const baseMaterial = this.game.materials.getFromName('emissiveOrangeRadialGradient')
        const material = new THREE.MeshBasicNodeMaterial({ transparent: true })
        material.outputNode = baseMaterial.outputNode
        material.positionNode = Fn(() =>
        {
            const newPosition = positionGeometry.toVar()

            const wave = sin(this.game.ticker.elapsedScaledUniform.mul(0.3).add(uv().y.mul(3)))
            const strength = uv().y.oneMinus().pow(2).mul(0.06)
            newPosition.x.addAssign(wave.mul(strength))

            return newPosition
        })()

        for(const mesh of meshes)
        {
            mesh.scale.setScalar(0)
            mesh.visible = false

            mesh.material = material
        }

        this.game.dayCycles.events.on('night', (inInterval) =>
        {
            if(inInterval)
            {
                for(const mesh of meshes)
                {
                    mesh.visible = true
                    gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: 10, ease: 'power1.out', overwrite: true })
                }
            }
            else
            {
                for(const mesh of meshes)
                {
                    gsap.to(mesh.scale, { x: 0, y: 0, z: 0, duration: 10, ease: 'power1.in', overwrite: true, onComplete: () =>
                    {
                        mesh.visible = false
                    } })
                }
            }
        })
    }

    setCauldron()
    {
        this.cauldron = {}

        {
            const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, transparent: true, depthTest: true, depthWrite: false })

            material.outputNode = Fn(() =>
            {
                const noiseUv = uv().mul(vec2(2, 0.2))
                noiseUv.y.addAssign(this.game.ticker.elapsedScaledUniform.mul(0.05))
                const noise = texture(this.game.noises.perlin, noiseUv).r

                const strength = noise.mul(uv().y.pow(2))

                const emissiveMix = strength.smoothstep(0, 1)
                const emissiveColor = mix(color('#ff3e00'), color('#ff8641'), emissiveMix).mul(strength.add(1).mul(2))

                return vec4(vec3(emissiveColor), strength)
            })()

            this.cauldron.heat = this.references.items.get('heat')[0]
            this.cauldron.heat.material = material
            this.cauldron.heat.castShadow = false
        }

        {
            const baseMaterial = this.game.materials.getFromName('palette')
            const material = baseMaterial.clone()

            const colorA = uniform(color('#ff6b2b'))
            const colorB = uniform(color('#ff4100'))
            const intensity = uniform(1.25)

            const baseOutput = baseMaterial.outputNode
            material.outputNode = Fn(() =>
            {
                const baseUv = uv(1).toVar()

                const emissiveColor = mix(colorA, colorB, baseUv.sub(0.5).length().mul(2))
                const emissiveOutput = emissiveColor.div(luminance(emissiveColor)).mul(intensity)

                const mixStrength = baseUv.sub(0.5).length().mul(2).pow2()
                const output = mix(baseOutput.rgb, emissiveOutput, mixStrength)

                return vec4(output.rgb, 1)
            })()

            this.cauldron.wood = this.references.items.get('wood')[0]
            this.cauldron.wood.material = material
        }

        {
            this.cauldron.liquid = {}

            const colorA = uniform(color(HERBAL_BREW.center))
            const colorB = uniform(color(HERBAL_BREW.rim))
            const intensity = uniform(HERBAL_BREW.intensity)

            const material = new THREE.MeshBasicNodeMaterial({ transparent: true })
            const mixedColor = mix(colorA, colorB, uv().sub(0.5).length().mul(2))
            material.colorNode = mixedColor.div(luminance(mixedColor)).mul(intensity)
            material.fog = false

            this.cauldron.liquid.surface = this.references.items.get('liquid')[0]
            this.cauldron.liquid.surface.material = material
        }
    }

    open()
    {
        if(this.state === LabArea.STATE_OPEN || this.state === LabArea.STATE_OPENING)
            return

        this.state = LabArea.STATE_OPENING

        if(this.stateTransition)
            this.stateTransition.kill()

        this.stateTransition = gsap.delayedCall(1.5, () =>
        {
            this.state = LabArea.STATE_OPEN
            this.stateTransition = null
        })

        this.game.inputs.filters.delete('wandering')
        this.game.inputs.filters.add('cinematic')

        this.game.view.cinematic.start(this.cinematic.position, this.cinematic.target)

        this.game.interactivePoints.temporaryHide()

        gsap.to(this.shadeMix.images.mixUniform, { value: this.shadeMix.images.max, duration: 2, ease: 'power2.inOut', overwrite: true })
        gsap.to(this.shadeMix.texts.mixUniform, { value: this.shadeMix.texts.max, duration: 2, ease: 'power2.inOut', overwrite: true })

        if(this.blackBoard.active)
        {
            this.blackBoard.timeline.repeat(-1)
            this.blackBoard.timeline.resume()
        }

        this.adjacents.nextIntersect.active = true
        this.adjacents.previousIntersect.active = true
        this.url.intersect.active = true

        this.game.physicalVehicle.deactivate()

        this.game.inputs.interactiveButtons.clearItems()
        this.game.inputs.interactiveButtons.addItems(['previous', 'next', 'open', 'close'])

        const sound = this.game.audio.groups.get('click')
        if(sound)
            sound.play(true)
    }

    close()
    {
        if(this.state === LabArea.STATE_CLOSED || this.state === LabArea.STATE_CLOSING)
            return

        this.state = LabArea.STATE_CLOSING

        if(this.stateTransition)
            this.stateTransition.kill()

        this.stateTransition = gsap.delayedCall(1.5, () =>
        {
            this.state = LabArea.STATE_CLOSED
            this.stateTransition = null
        })

        this.game.inputs.filters.delete('cinematic')
        this.game.inputs.filters.add('wandering')

        this.game.view.cinematic.end()

        gsap.to(this.shadeMix.images.mixUniform, { value: this.shadeMix.images.min, duration: 1.5, ease: 'power2.inOut', overwrite: true })
        gsap.to(this.shadeMix.texts.mixUniform, { value: this.shadeMix.texts.min, duration: 1.5, ease: 'power2.inOut', overwrite: true })

        gsap.delayedCall(1, () =>
        {
            this.game.interactivePoints.recover()
        })

        this.adjacents.nextIntersect.active = false
        this.adjacents.previousIntersect.active = false
        this.url.intersect.active = false

        this.game.physicalVehicle.activate()

        this.game.inputs.interactiveButtons.clearItems()

        const sound = this.game.audio.groups.get('click')
        if(sound)
            sound.play(false)
    }

    previous()
    {
        if(this.state === LabArea.STATE_CLOSED || this.state === LabArea.STATE_CLOSING)
            return

        this.changeProject(this.navigation.index - 1, LabArea.DIRECTION_PREVIOUS)

        this.blackBoard.active = false
    }

    next()
    {
        if(this.state === LabArea.STATE_CLOSED || this.state === LabArea.STATE_CLOSING)
            return

        this.changeProject(this.navigation.index + 1, LabArea.DIRECTION_NEXT)

        this.blackBoard.active = false
    }

    changeProject(index = 0, direction = null, silent = false)
    {
        let loopIndex = index

        if(loopIndex > labData.length - 1)
            loopIndex = 0
        else if(loopIndex < 0)
            loopIndex = labData.length - 1

        if(this.navigation.index === loopIndex)
            return

        if(direction === null)
            direction = signedModDelta(loopIndex, this.navigation.index, labData.length) > 0 ? LabArea.DIRECTION_PREVIOUS : LabArea.DIRECTION_NEXT

        this.navigation.index = loopIndex
        this.navigation.current = labData[this.navigation.index]
        this.navigation.previous = labData[(this.navigation.index - 1) < 0 ? labData.length - 1 : this.navigation.index - 1]
        this.navigation.next = labData[(this.navigation.index + 1) % labData.length]
        this.navigation.direction = direction

        this.title.update(direction)
        this.url.update(direction)
        this.images.update()

        this.scroller.update(this.navigation.index)

        if(!silent)
        {
            this.game.audio.groups.get('click').play()
            this.game.audio.groups.get('slide').play()
            this.game.audio.groups.get('assemble').play()
        }
    }

    update()
    {
        if(this.state !== LabArea.STATE_CLOSED)
        {
            this.scroller.animate()
        }
    }
}
