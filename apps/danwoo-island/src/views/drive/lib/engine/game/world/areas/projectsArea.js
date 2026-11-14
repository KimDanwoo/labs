import { autoBinding } from '../../utilities/autoBinding'
import * as THREE from 'three/webgpu'
import { rebuildVillageProps } from '../islandVillage'
import { rebuildProjectsGate } from '../islandStructures'
import { removeAwardsTable } from '../islandReskins'
import { Game } from '../../game'
import { InteractivePoints } from '../../interactivePoints'
import gsap from 'gsap'
import projectsData from '../../../data/projects'
import { TextCanvas } from '../../textCanvas'
import { add, color, float, Fn, If, luminance, mix, mul, normalWorld, positionGeometry, sin, step, texture, uniform, uv, vec3, vec4 } from 'three/tsl'
import { Inputs } from '../../inputs/inputs'
import { MeshDefaultMaterial } from '../../materials/meshDefaultMaterial'
import { Area } from './area'

export class ProjectsArea extends Area
{
    setObjects()
    {
        rebuildVillageProps(this.model, this.game.materials)
        rebuildProjectsGate(this.model, this.game.materials)
        removeAwardsTable(this.model)
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

        this.state = ProjectsArea.STATE_CLOSED

        this.setSounds()
        this.setInteractivePoint()
        this.setInputs()
        this.setCinematic()
        this.setShadeMix()
        this.setTexts()
        this.setHover()
        this.setNavigation()
        this.setImages()
        this.setPagination()
        this.setAttributes()
        this.setAdjacents()
        this.setTitle()
        this.setUrl()
        this.setBlackBoard()
        this.setOven()
        this.setGrinder()
        this.setAnvil()

        this.changeProject(0, ProjectsArea.DIRECTION_NEXT, false, true)
    }

    setSounds()
    {
        this.sounds = {}
        this.sounds.anvil = this.game.audio.register({
            path: 'sounds/anvil/METLImpt_Anvil Single Hammer Strike Hammers_GENHD1-01372.mp3',
            autoplay: false,
            loop: false,
            volume: 0.5,
            antiSpam: 0.1,
            positions: this.references.items.get('anvil')[0].position,
            distanceFade: 18,
            onPlay: (item) =>
            {
                item.volume = 0.1 + Math.random() * 0.1
                item.rate = 1 + Math.random() * 0.02
            }
        })
    }

    setInteractivePoint()
    {
        this.interactivePoint = this.game.interactivePoints.create(
            this.references.items.get('interactivePoint')[0].position,
            '프로젝트',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.open()
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
            if(!action.active && this.state === ProjectsArea.STATE_OPEN)
            {
                this.url.open()
            }
        })

        this.game.inputs.interactiveButtons.events.on('previous', () =>
        {
            if(this.state === ProjectsArea.STATE_OPEN)
                this.previous()
        })

        this.game.inputs.interactiveButtons.events.on('next', () =>
        {
            if(this.state === ProjectsArea.STATE_OPEN)
                this.next()
        })

        this.game.inputs.interactiveButtons.events.on('open', () =>
        {
            if(this.state === ProjectsArea.STATE_OPEN)
                this.url.open()
        })

        this.game.inputs.interactiveButtons.events.on('close', () =>
        {
            if(this.state === ProjectsArea.STATE_OPEN)
                this.close()
        })
    }

    setCinematic()
    {
        this.cinematic = {}

        this.cinematic.position = new THREE.Vector3()
        this.cinematic.positionOffset = new THREE.Vector3(4.65, 4, 4.85)

        this.cinematic.target = new THREE.Vector3()
        this.cinematic.targetOffset = new THREE.Vector3(-3.0, 1.60, -4.60)

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
        this.navigation.index = 0
        this.navigation.current = null
        this.navigation.next = null
        this.navigation.previous = null
    }

    setImages()
    {
        this.images = {}
        this.images.initiated = false
        this.images.width = 1920 * 0.5
        this.images.height = 1080 * 0.5
        this.images.index = 0
        this.images.direction = ProjectsArea.DIRECTION_NEXT
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

            if(this.navigation.current.images[this.images.index] === key)
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
            let imageIndex = this.images.index

            if(this.images.direction === ProjectsArea.DIRECTION_PREVIOUS)
                imageIndex -= 1
            else
                imageIndex += 1

            if(imageIndex < 0)
            {
                projectIndex -= 1

                if(projectIndex < 0)
                    projectIndex = projectsData.length - 1

                imageIndex = projectsData[projectIndex].images.length - 1
            }
            else if(imageIndex > this.navigation.current.images.length - 1)
            {
                projectIndex += 1

                if(projectIndex > projectsData.length - 1)
                    projectIndex = 0

                imageIndex = 0
            }

            const key = projectsData[projectIndex].images[imageIndex]
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

        this.images.update = (direction) =>
        {
            this.images.direction = direction

            const key = this.navigation.current.images[this.images.index]
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
            this.images.animationDirection.value = direction === ProjectsArea.DIRECTION_NEXT ? 1 : -1
        }
    }

    setPagination()
    {
        this.pagination = {}
        this.pagination.inter = 0.2
        this.pagination.group = this.references.items.get('pagination')[0].children[0]
        this.pagination.items = []

        let i = 0
        const intersectPagination = this.references.items.get('intersectPagination')

        for(const child of this.pagination.group.children)
        {
            if(child instanceof THREE.Mesh)
            {
                const item = {}

                item.index = i
                item.visible = false

                item.mesh = child
                item.mesh.position.x = this.pagination.inter * i
                item.mesh.visible = false
                item.mesh.material = this.hover.inactiveMaterial

                item.intersectReference = intersectPagination[i]

                item.intersect = this.game.rayCursor.addIntersect({
                    active: false,
                    shape: new THREE.Sphere(new THREE.Vector3(), item.intersectReference.scale.x),
                    onClick: () =>
                    {
                        this.changeImage(item.index)
                    },
                    onEnter: () =>
                    {
                        item.mesh.material = this.hover.activeMaterial
                    },
                    onLeave: () =>
                    {
                        item.mesh.material = this.hover.inactiveMaterial
                    }
                }),
                item.intersectReference.getWorldPosition(item.intersect.shape.center)

                this.pagination.items.push(item)

                i++
            }
        }

        const intersectPrevious = this.references.items.get('intersectPreviousImage')[0]
        const intersectPreviousPosition = new THREE.Vector3()
        intersectPrevious.getWorldPosition(intersectPreviousPosition)
        const arrowPrevious = this.references.items.get('arrowPreviousImage')[0]
        arrowPrevious.material = this.hover.inactiveMaterial

        this.pagination.previousIntersect = this.game.rayCursor.addIntersect({
            active: false,
            shape: new THREE.Sphere(intersectPreviousPosition, intersectPrevious.scale.x),
            onClick: () =>
            {
                this.previous()
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

        const intersectNext = this.references.items.get('intersectNextImage')[0]
        const intersectNextPosition = new THREE.Vector3()
        intersectNext.getWorldPosition(intersectNextPosition)
        const arrowNext = this.references.items.get('arrowNextImage')[0]
        arrowNext.material = this.hover.inactiveMaterial
        this.pagination.nextIntersect = this.game.rayCursor.addIntersect({
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

        this.pagination.update = () =>
        {
            let i = 0
            for(const item of this.pagination.items)
            {
                if(i <= this.navigation.current.images.length - 1)
                {
                    if(!item.visible)
                    {
                        gsap.to(item.mesh.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'power1.inOut', overwrite: true })
                        item.mesh.visible = true
                        item.visible = true
                        item.intersect.active = this.state === ProjectsArea.STATE_OPENING || this.state === ProjectsArea.STATE_OPEN
                    }
                }
                else
                {
                    if(item.visible)
                    {
                        gsap.to(item.mesh.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.5, ease: 'power1.inOut', overwrite: true, onComplete: () =>
                        {
                            item.mesh.visible = false
                        } })
                        item.visible = false
                        item.intersect.active = false
                    }
                }

                item.mesh.rotation.z = this.images.index === i ? 0 : Math.PI

                i++
            }

            const offset = - (this.navigation.current.images.length - 1) * this.pagination.inter / 2
            gsap.to(this.pagination.group.position, { x: offset, duration: 0.5, ease: 'power1.inOut', overwrite: true, onComplete: () =>
            {
                for(const item of this.pagination.items)
                    item.intersectReference.getWorldPosition(item.intersect.shape.center)
            } })
        }
    }

    setAttributes()
    {
        this.attributes = {}
        this.attributes.group = this.references.items.get('attributes')[0]
        this.attributes.inter = 0.75
        this.attributes.names = ['role', 'at', 'with']
        this.attributes.items = {}
        this.attributes.status = 'hidden'
        this.attributes.originalY = this.attributes.group.position.y

        for(const child of this.attributes.group.children)
        {
            const item = {}
            item.group = child
            item.visible = false
            item.group.visible = false
            const textMesh = item.group.children.find(_child => _child.name.startsWith('text'))
            item.textCanvas = new TextCanvas(
                this.texts.fontFamily,
                this.texts.fontWeight,
                this.texts.fontSizeMultiplier * 0.23,
                1.4,
                0.45,
                this.texts.density,
                'center',
                0.2
            )

            this.texts.createMaterialOnMesh(textMesh, item.textCanvas.texture)

            this.attributes.items[child.name] = item
        }

        this.attributes.update = () =>
        {
            if(this.attributes.status === 'hiding')
                return

            this.attributes.status = 'hiding'
            let i = 0
            for(const name of this.attributes.names)
            {
                const item = this.attributes.items[name]

                gsap.to(item.group.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.5, delay: 0.1 * i, ease: 'power2.in', overwrite: true })
                i++
            }

            gsap.delayedCall(1, () =>
            {
                this.attributes.status = 'visible'

                let i = 0
                for(const name of this.attributes.names)
                {
                    const item = this.attributes.items[name]
                    const attribute = this.navigation.current.attributes[name]

                    if(attribute)
                    {
                        item.group.visible = true
                        gsap.to(item.group.scale, { x: 1, y: 1, z: 1, duration: 1, delay: 0.2 * i, ease: 'back.out(2)', overwrite: true })

                        item.textCanvas.updateText(attribute)

                        item.group.position.y = - i * 0.75

                        i++
                    }
                }

                this.attributes.group.position.y = this.attributes.originalY + (i - 1) * 0.75 / 2
            })
        }
    }

    setAdjacents()
    {
        this.adjacents = {}
        this.adjacents.status = 'hidden'

        this.adjacents.previous = {}
        this.adjacents.previous.group = this.references.items.get('previous')[0]
        this.adjacents.previous.inner = this.adjacents.previous.group.children[0]

        this.adjacents.previous.textMesh = this.adjacents.previous.inner.children.find(_child => _child.name.startsWith('text'))
        this.adjacents.previous.textCanvas = new TextCanvas(
            this.texts.fontFamily,
            this.texts.fontWeight,
            this.texts.fontSizeMultiplier * 0.3,
            1.25,
            0.75,
            this.texts.density,
            'center',
            0.3
        )
        this.texts.createMaterialOnMesh(this.adjacents.previous.textMesh, this.adjacents.previous.textCanvas.texture)

        const arrowPrevious = this.references.items.get('arrowPreviousProject')[0]
        arrowPrevious.material = this.hover.inactiveMaterial

        const intersectPrevious = this.references.items.get('intersectPreviousProject')[0]
        const intersectPreviousPosition = new THREE.Vector3()
        intersectPrevious.getWorldPosition(intersectPreviousPosition)

        this.adjacents.previous.intersect = this.game.rayCursor.addIntersect({
            active: false,
            shape: new THREE.Sphere(intersectPreviousPosition, intersectPrevious.scale.x),
            onClick: () =>
            {
                this.previousProject(true)
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

        this.adjacents.next = {}
        this.adjacents.next.group = this.references.items.get('next')[0]
        this.adjacents.next.inner = this.adjacents.next.group.children[0]

        this.adjacents.next.textMesh = this.adjacents.next.inner.children.find(_child => _child.name.startsWith('text'))
        this.adjacents.next.textCanvas = new TextCanvas(
            this.texts.fontFamily,
            this.texts.fontWeight,
            this.texts.fontSizeMultiplier * 0.3,
            1.25,
            0.75,
            this.texts.density,
            'center',
            0.3
        )
        this.texts.createMaterialOnMesh(this.adjacents.next.textMesh, this.adjacents.next.textCanvas.texture)

        const arrowNext = this.references.items.get('arrowNextProject')[0]
        arrowNext.material = this.hover.inactiveMaterial

        const intersectNext = this.references.items.get('intersectNextProject')[0]

        const intersectNextPosition = new THREE.Vector3()
        intersectNext.getWorldPosition(intersectNextPosition)

        this.adjacents.next.intersect = this.game.rayCursor.addIntersect({
            active: false,
            shape: new THREE.Sphere(intersectNextPosition, intersectNext.scale.x),
            onClick: () =>
            {
                this.nextProject()
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

        this.adjacents.update = () =>
        {
            if(this.adjacents.status === 'hiding')
                return

            this.adjacents.status = 'hiding'

            gsap.to(this.adjacents.previous.inner.rotation, { z: Math.PI * 0.5, duration: 0.5, delay: 0, ease: 'power2.in', overwrite: true })
            gsap.to(this.adjacents.next.inner.rotation, { z: - Math.PI * 0.5, duration: 0.5, delay: 0.2, ease: 'power2.in', overwrite: true })

            gsap.delayedCall(1, () =>
            {
                this.adjacents.status = 'visible'

                gsap.to(this.adjacents.previous.inner.rotation, { z: 0, duration: 1, delay: 0, ease: 'back.out(2)', overwrite: true })
                gsap.to(this.adjacents.next.inner.rotation, { z: 0, duration: 1, delay: 0.4, ease: 'back.out(2)', overwrite: true })

                this.adjacents.previous.textCanvas.updateText(this.navigation.previous.titleSmall)
                this.adjacents.next.textCanvas.updateText(this.navigation.next.titleSmall)
            })
        }
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

            const rotationDirection = direction === ProjectsArea.DIRECTION_NEXT ? - 1 : 1

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

            const rotationDirection = direction === ProjectsArea.DIRECTION_NEXT ? - 1 : 1

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
                if(this.state === ProjectsArea.STATE_CLOSED || this.state === ProjectsArea.STATE_CLOSING || !this.blackBoard.active)
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

        this.game.inputs.events.on('modeChange', () =>
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

    setOven()
    {
        this.oven = {}

        this.oven.blower = this.references.items.get('blower')[0]

        this.oven.charcoal = this.references.items.get('charcoal')[0]

        this.oven.threshold = uniform(0.2)

        const alphaNode = Fn(() =>
        {
            const baseUv = uv()

            const voronoi = texture(
                this.game.noises.voronoi,
                baseUv
            ).g

            voronoi.subAssign(this.oven.threshold)

            return voronoi
        })()

        const material = new MeshDefaultMaterial({
            colorNode: color(0x6F6A87),
            alphaNode: alphaNode,
            hasWater: false,
            hasLightBounce: false
        })

        this.oven.charcoal.material = material

        this.oven.thresholdBinding = autoBinding(this.oven.threshold, 'value', () => - Math.sin(this.game.ticker.elapsedScaled - 0.5) * 0.1 + 0.25)
    }

    setGrinder()
    {
        this.grinder = this.references.items.get('grinder')[0]
    }

    setAnvil()
    {
        this.anvil = {}
        this.anvil.frequency = 1
        this.anvil.loopTime = 0

        this.anvil.hammer = this.references.items.get('hammer')[0]
        this.anvil.hammer.rotation.reorder('ZXY')

        this.anvil.blade = this.references.items.get('blade')[0]

        const material = new MeshDefaultMaterial({
            colorNode: color('#a88c7f')
        })

        const colorA = uniform(color('#ff8641'))
        const colorB = uniform(color('#ff3e00'))
        const intensity = uniform(1.7)

        const baseOutput = material.outputNode
        material.outputNode = Fn(() =>
        {
            const baseUv = uv(1).toVar()

            const emissiveColor = mix(colorA, colorB, uv().sub(0.5).length().mul(10))
            const emissiveOutput = emissiveColor.div(luminance(emissiveColor)).mul(intensity)

            const mixStrength = baseUv.y.smoothstep(0.4, 0.9)
            const output = mix(baseOutput.rgb, emissiveOutput, mixStrength)

            return vec4(output.rgb, 1)
        })()

        this.anvil.blade.material = material
    }

    open()
    {
        if(this.state === ProjectsArea.STATE_OPEN || this.state === ProjectsArea.STATE_OPENING)
            return

        this.state = ProjectsArea.STATE_OPENING

        if(this.stateTransition)
            this.stateTransition.kill()

        this.stateTransition = gsap.delayedCall(1.5, () =>
        {
            this.state = ProjectsArea.STATE_OPEN
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

        for(const item of this.pagination.items)
            item.intersect.active = item.visible

        this.adjacents.next.intersect.active = true
        this.adjacents.previous.intersect.active = true
        this.pagination.previousIntersect.active = true
        this.pagination.nextIntersect.active = true
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
        if(this.state === ProjectsArea.STATE_CLOSED || this.state === ProjectsArea.STATE_CLOSING)
            return

        this.state = ProjectsArea.STATE_CLOSING

        if(this.stateTransition)
            this.stateTransition.kill()

        this.stateTransition = gsap.delayedCall(1.5, () =>
        {
            this.state = ProjectsArea.STATE_CLOSED
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

        for(const item of this.pagination.items)
            item.intersect.active = false

        this.adjacents.next.intersect.active = false
        this.adjacents.previous.intersect.active = false
        this.pagination.previousIntersect.active = false
        this.pagination.nextIntersect.active = false
        this.url.intersect.active = false

        this.game.physicalVehicle.activate()

        this.game.inputs.interactiveButtons.clearItems([])

        const sound = this.game.audio.groups.get('click')
        if(sound)
            sound.play(false)
    }

    previous()
    {
        if(this.images.index > 0)
            this.previousImage()
        else
            this.previousProject(false)
    }

    previousImage()
    {
        if(this.state === ProjectsArea.STATE_CLOSED || this.state === ProjectsArea.STATE_CLOSING)
            return

        this.changeImage(this.images.index - 1, ProjectsArea.DIRECTION_PREVIOUS)

        this.blackBoard.active = false
    }

    previousProject(firstImage = false)
    {
        if(this.state === ProjectsArea.STATE_CLOSED || this.state === ProjectsArea.STATE_CLOSING)
            return

        this.changeProject(this.navigation.index - 1, ProjectsArea.DIRECTION_PREVIOUS, firstImage)

        this.blackBoard.active = false
    }

    next()
    {
        if(this.images.index < this.navigation.current.images.length - 1)
            this.nextImage()
        else
            this.nextProject()
    }

    nextImage()
    {
        if(this.state === ProjectsArea.STATE_CLOSED || this.state === ProjectsArea.STATE_CLOSING)
            return

        this.changeImage(this.images.index + 1, ProjectsArea.DIRECTION_NEXT)

        this.blackBoard.active = false
    }

    nextProject()
    {
        if(this.state === ProjectsArea.STATE_CLOSED || this.state === ProjectsArea.STATE_CLOSING)
            return

        this.changeProject(this.navigation.index + 1, ProjectsArea.DIRECTION_NEXT)

        this.blackBoard.active = false
    }

    changeProject(index = 0, direction = ProjectsArea.DIRECTION_NEXT, firstImage = false, silent = false)
    {
        let loopIndex = index

        if(loopIndex > projectsData.length - 1)
            loopIndex = 0
        else if(loopIndex < 0)
            loopIndex = projectsData.length - 1

        this.navigation.index = loopIndex
        this.navigation.current = projectsData[this.navigation.index]
        this.navigation.previous = projectsData[(this.navigation.index - 1) < 0 ? projectsData.length - 1 : this.navigation.index - 1]
        this.navigation.next = projectsData[(this.navigation.index + 1) % projectsData.length]

        this.attributes.update()
        this.adjacents.update()
        this.title.update(direction)
        this.url.update(direction)

        let imageIndex = null
        if(firstImage)
            imageIndex = 0
        else
            imageIndex = direction === ProjectsArea.DIRECTION_NEXT ? 0 : this.navigation.current.images.length - 1

        if(!silent)
        {
            this.game.audio.groups.get('click').play()
            this.game.audio.groups.get('assemble').play()
        }

        this.changeImage(imageIndex, direction, silent)
    }

    changeImage(imageIndex = 0, direction = null, silent = false)
    {
        if(direction === null)
            direction = imageIndex > this.images.index ? ProjectsArea.DIRECTION_NEXT : ProjectsArea.DIRECTION_PREVIOUS

        this.images.index = imageIndex

        this.images.update(direction)
        this.pagination.update()

        if(!silent)
        {
            this.game.audio.groups.get('click').play()
            this.game.audio.groups.get('slide').play()
        }
    }

    update()
    {
        this.oven.blower.scale.y = (Math.sin(this.game.ticker.elapsedScaled) * 0.2 + 0.8)
        this.oven.thresholdBinding.update()

        this.grinder.rotation.z = - this.game.ticker.elapsedScaled * 0.75

        const time = this.game.ticker.elapsedScaled * this.anvil.frequency + Math.PI * 0.25
        this.anvil.hammer.rotation.x = Math.pow(1 - Math.abs(Math.sin(time)), 5) - 1

        const loopTime = ((time) / Math.PI) % 1
        if(loopTime < this.anvil.loopTime)
            this.sounds.anvil.play()

        this.anvil.loopTime = loopTime
    }
}
