import * as THREE from 'three/webgpu'
import { color, Fn, luminance, max, mix, step, texture, uniform, uv, vec4 } from 'three/tsl'
import gsap from 'gsap'
import { clamp } from 'three/src/math/MathUtils.js'
import { Area } from './area'
import { paintCareerLines } from '../islandReskins'
import { InteractivePoints } from '../../interactivePoints'
import content from '../../../data/danwoo'

export class CareerArea extends Area
{
    setObjects()
    {
        paintCareerLines(this.model, this.game.materials)
        super.setObjects()
    }

    constructor(references)
    {
        super(references)

        // Debug

        this.setSounds()
        this.setLines()
        this.references.items.get('year')[0].removeFromParent()
        this.setResumeLink()
    }

    setSounds()
    {
        this.sounds = {}
        this.sounds.stoneOut = this.game.audio.register({
            path: 'sounds/stoneSlides/stoneSlideOut.mp3',
            autoplay: false,
            loop: false,
            volume: 0.3,
            antiSpam: 0.1,
            positions: new THREE.Vector3(),
            distanceFade: 14,
            onPlay: (item, line) =>
            {
                item.positions[0].copy(line.origin)
                item.rate = 1.2 + line.index * 0.1
            }
        })
        this.sounds.stoneIn = this.game.audio.register({
            path: 'sounds/stoneSlides/stoneSlideIn.mp3',
            autoplay: false,
            loop: false,
            volume: 0.2,
            rate: 0.8,
            antiSpam: 0.1,
            positions: new THREE.Vector3(),
            distanceFade: 14,
            onPlay: (item, line) =>
            {
                item.positions[0].copy(line.origin)
                // item.rate = 0.9 + Math.random() * 0.2
            }
        })
    }

    setLines()
    {
        this.lines = {}
        this.lines.items = []
        this.lines.activeElevation = 2.5
        this.lines.padding = 0.25

        const lineGroups = this.references.items.get('line')

        const colors = {
            blue: uniform(color('#5390ff')),
            orange: uniform(color('#ff8039')),
            purple: uniform(color('#b65fff')),
            green: uniform(color('#a2ffab'))
        }

        for(const group of lineGroups)
        {
            const line = {}
            line.group = group
            line.size = parseFloat(line.group.userData.size)
            line.hasEnd = line.group.userData.hasEnd
            line.color = line.group.userData.color
            line.texture = this.createProfileTexture(line.group.userData.texture)

            line.stone = line.group.children.find(child => child.name.startsWith('stone'))
            line.stone.position.y = 0

            line.origin = line.group.position.clone()

            line.isIn = false
            line.isUp = false
            line.elevationTarget = 0
            line.offsetTarget = 0
            line.labelReveal = uniform(0)

            {
                line.textMesh = line.stone.children.find(child => child.name.startsWith('careerText'))

                const material = new THREE.MeshLambertNodeMaterial({ transparent: true })

                const baseColor = colors[line.color]

                material.outputNode = Fn(() =>
                {
                    const baseUv = uv().toVar()

                    step(baseUv.x, line.labelReveal).lessThan(0.5).discard()

                    const textureColor = texture(line.texture, baseUv)

                    const alpha = step(0.1, max(textureColor.r, textureColor.g))

                    const emissiveColor = baseColor.div(luminance(baseColor)).mul(1.7)

                    const maskColor = color('#251f2b')
                    const finalColor = mix(maskColor, emissiveColor, textureColor.r)

                    return vec4(finalColor, alpha)
                })()

                // Mesh
                line.textMesh.castShadow = false
                line.textMesh.receiveShadow = false
                line.textMesh.material = material
            }

            this.lines.items.push(line)
        }

        this.lines.items.sort((a, b) => b.origin.z - a.origin.z)

        let i = 0
        for(const line of this.lines.items)
        {
            line.index = i++
        }

        // Debug
    }

    createProfileTexture(name)
    {
        const labels = {
            careerFreelancer: ['DANWOO KIM', 'FRONTEND ENGINEER'],
            careerHetic: ['PRODUCT', 'STRUCTURE & DATA'],
            careerImmersiveGarden: ['BUILD & SHIP', 'IDEAS INTO PRODUCTS'],
            careerIRLTeacher: ['DANWOO LAB', 'PROJECTS & EXPERIMENTS'],
            careerOnlineTeacher: ['DANSOON', 'DEVELOPMENT JOURNAL'],
            careerUzik: ['MY EXPERIENCE', 'OPEN RESUME'],
        }
        const lines = labels[name] ?? ['DANWOO KIM', 'OPEN RESUME']
        const canvas = document.createElement('canvas')
        canvas.width = 1024
        canvas.height = 256
        const context = canvas.getContext('2d')
        context.fillStyle = '#000000'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillStyle = '#ff0000'
        context.font = '700 70px MaruBuri'
        context.fillText(lines[0], 512, 84, 960)
        context.fillStyle = '#00ff00'
        context.font = '700 38px MaruBuri'
        context.fillText(lines[1], 512, 176, 960)
        const texture = new THREE.CanvasTexture(canvas)
        texture.flipY = false
        texture.minFilter = THREE.LinearFilter
        return texture
    }

    setResumeLink()
    {
        const position = this.references.items.get('year')[0].position.clone()
        position.y = 1
        this.interactivePoint = this.game.interactivePoints.create(
            position,
            '이력서 보기',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () => window.open(content.resumeUrl, '_blank', 'noopener,noreferrer'),
            () => this.game.inputs.interactiveButtons.addItems(['interact']),
            () => this.game.inputs.interactiveButtons.removeItems(['interact']),
            () => this.game.inputs.interactiveButtons.removeItems(['interact'])
        )
    }

    update()
    {
        // Lines
        for(const line of this.lines.items)
        {
            const delta = line.origin.z - this.game.player.position.z

            // Is in
            if(delta > - this.lines.padding && delta < line.size + this.lines.padding * 2)
            {
                if(!line.isIn)
                {
                    line.isIn = true
                    gsap.to(line.labelReveal, { value: 1, duration: 1, delay: 0.3, overwrite: true, ease: 'power2.inOut' })
                }
            }

            // Is out
            else
            {
                if(line.isIn)
                {
                    line.isIn = false
                    gsap.to(line.labelReveal, { value: 0, duration: 1, overwrite: true, ease: 'power2.inOut' })
                }
            }

            // Elevation
            if(line.isIn)
            {
                if(!line.isUp)
                {
                    line.isUp = true
                    this.sounds.stoneOut.play(line)
                }
            }
            else
            {
                if(delta > line.size)
                {
                    if(line.hasEnd)
                    {
                        if(line.isUp)
                        {
                            line.isUp = false
                            gsap.delayedCall(0.3, () =>
                            {
                                this.sounds.stoneIn.play(line)
                            })
                        }
                    }
                }
                else
                {
                    if(line.isUp)
                    {
                        line.isUp = false
                        gsap.delayedCall(0.3, () =>
                        {
                            this.sounds.stoneIn.play(line)
                        })
                    }
                }
            }

            line.elevationTarget = line.isUp ? this.lines.activeElevation : 0
            line.stone.position.y += (line.elevationTarget - line.stone.position.y) * this.game.ticker.deltaScaled * 3

            // Position
            if(line.isIn)
            {
                if(line.stone.position.y > 1)
                    line.offsetTarget = - clamp(delta, 0, line.size)
            }
            else
            {
                // End
                if(delta > line.size)
                    line.offsetTarget = - line.size
                // Start
                else
                    line.offsetTarget = 0
            }

            line.stone.position.z += (line.offsetTarget - line.stone.position.z) * this.game.ticker.deltaScaled * 10
        }

    }
}
