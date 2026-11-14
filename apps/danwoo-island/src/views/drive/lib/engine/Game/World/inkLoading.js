import * as THREE from 'three/webgpu'
import { atan, color, Fn, TWO_PI, positionGeometry, positionWorld, texture, vec2, vec4 } from 'three/tsl'
import { WORLD_CONFIG } from '../../worldConfig.js'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'

export const isInkLoading = WORLD_CONFIG.loadingStyle === 'ink'

const SEA = { base: '#1b2a4a', wave: '#2a3b62', tile: 256, radius: 64, rings: 4, worldScale: 0.25 }
const BRUSH = { color: '#efe2c4', intensity: 1.15, threshold: 0.5, thickness: 0.55 }
export const INK_REVEAL = { color: '#efe2c4', intensity: 1.6 }
export const INK_LABEL = '#efe2c4'

function drawScallop(context, x, y)
{
    const { radius, rings, base, wave } = SEA
    context.fillStyle = base
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
    context.strokeStyle = wave
    context.lineWidth = 3
    for(let ring = 1; ring <= rings; ring++)
    {
        context.beginPath()
        context.arc(x, y, (radius * ring) / rings - 2, 0, Math.PI * 2)
        context.stroke()
    }
}

function createWaveTexture()
{
    const { tile, radius } = SEA
    const canvas = document.createElement('canvas')
    canvas.width = tile
    canvas.height = tile
    const context = canvas.getContext('2d')
    context.fillStyle = SEA.base
    context.fillRect(0, 0, tile, tile)
    const rowGap = radius / 2
    for(let row = -4; row <= tile / rowGap + 4; row++)
    {
        const offset = Math.abs(row) % 2 === 0 ? 0 : radius
        for(let column = -2; column <= tile / (radius * 2) + 2; column++)
            drawScallop(context, column * radius * 2 + offset, row * rowGap)
    }
    const waveTexture = new THREE.CanvasTexture(canvas)
    waveTexture.wrapS = THREE.RepeatWrapping
    waveTexture.wrapT = THREE.RepeatWrapping
    waveTexture.colorSpace = THREE.SRGBColorSpace
    return waveTexture
}

export function inkSeaMaterial(game)
{
    const waveTexture = createWaveTexture()
    const seaMaterial = new MeshDefaultMaterial({
        colorNode: texture(waveTexture, positionWorld.xz.mul(SEA.worldScale)).rgb,
        hasWater: false,
        hasReveal: false,
        hasLightBounce: false,
    })
    const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide })
    material.addEventListener('dispose', () => waveTexture.dispose())
    material.outputNode = Fn(() =>
    {
        positionWorld.xz.sub(game.reveal.position2Uniform).length().lessThan(game.reveal.distance).discard()
        return seaMaterial.outputNode
    })()
    return material
}

export function inkRingGeometry(radius)
{
    return new THREE.RingGeometry(radius - BRUSH.thickness, radius, 128, 1)
}

export function inkBrushMaterial(progress, brushTexture, radius)
{
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
    material.addEventListener('dispose', () => brushTexture.dispose())
    material.outputNode = Fn(() =>
    {
        const angleProgress = atan(positionGeometry.y, positionGeometry.x).div(TWO_PI).add(0.5).oneMinus()
        progress.lessThan(angleProgress).discard()
        const across = positionGeometry.xy.length().sub(radius - BRUSH.thickness).div(BRUSH.thickness)
        const bristle = texture(brushTexture, vec2(angleProgress, across)).r
        bristle.lessThan(BRUSH.threshold).discard()
        return vec4(color(BRUSH.color).mul(BRUSH.intensity), 1)
    })()
    return material
}
