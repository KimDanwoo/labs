import * as THREE from 'three/webgpu'
import { Game } from './game'
import MeshGridMaterial, { MeshGridMaterialLine } from './materials/meshGridMaterial'
import { color, Fn, mix, round, smoothstep, texture, uniform, uv, vec2 } from 'three/tsl'

export class Terrain
{
    constructor()
    {
        this.game = Game.getInstance()

        this.subdivision = 128
        this.size = 192


        this.setGradient()
        this.setNodes()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 10)
    }

    setGradient()
    {
        const height = 16

        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = height

        this.gradientTexture = new THREE.Texture(canvas)
        this.gradientTexture.colorSpace = THREE.SRGBColorSpace

        const context = canvas.getContext('2d')

        this.colors = [
            { stop: 0.1, value: '#f2d7a5' },
            { stop: 0.3, value: '#42c9c6' },
            { stop: 0.9, value: '#14658b' },
        ]

        const update = () =>
        {
            const gradient = context.createLinearGradient(0, 0, 0, height)
            for(const color of this.colors)
                gradient.addColorStop(color.stop, color.value)

            context.fillStyle = gradient
            context.fillRect(0, 0, 1, height)
            this.gradientTexture.needsUpdate = true
        }

        update()

        // // Debug
        // canvas.style.position = 'fixed'
        // canvas.style.zIndex = 999
        // canvas.style.top = 0
        // canvas.style.left = 0
        // canvas.style.width = '128px'
        // canvas.style.height = `256px`
        // document.body.append(canvas)
        
    }

    setNodes()
    {
        this.grassColorUniform = uniform(color('#79b94d'))
        this.tracksDelta = uniform(vec2(0))

        const worldPositionToUvNode = Fn(([position]) =>
        {
            return position.div(this.subdivision).div(1.5).add(0.5)
        })

        this.terrainNode = Fn(([position]) =>
        {
            const textureUv = worldPositionToUvNode(position)
            const data = texture(this.game.resources.terrainTexture, textureUv)

            // Wheel tracks
            const groundDataColor = texture(
                this.game.tracks.renderTarget.texture,
                position.sub(- this.game.tracks.halfSize).sub(this.tracksDelta).div(this.game.tracks.size)
            )
            data.g.mulAssign(groundDataColor.r.oneMinus())

            return data
        })
        
        this.colorNode = Fn(([terrainData]) =>
        {
            // Dirt and water
            const baseColor = texture(this.gradientTexture, vec2(0, terrainData.b.oneMinus()))

            // Grass
            baseColor.assign(mix(baseColor, this.grassColorUniform, terrainData.g))

            return baseColor.rgb
        })

    }
    
    update()
    {
        // Tracks delta
        this.tracksDelta.value.set(
            this.game.tracks.focusPoint.x,
            this.game.tracks.focusPoint.y
        )
    }
}