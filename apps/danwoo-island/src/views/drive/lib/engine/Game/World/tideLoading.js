import * as THREE from 'three/webgpu'
import { atan, color, float, Fn, fwidth, mix, positionGeometry, positionWorld, TWO_PI, vec2, vec4 } from 'three/tsl'
import { WORLD_CONFIG } from '../../worldConfig.js'

const SEA = {
    center: '#0B6A80',
    edge: '#071A2B',
    caustic: '#4FE3D6',
    sunrise: '#FFC46B',
    gradientStart: 2,
    gradientEnd: 42,
    patternScale: 1.7,
    drift: [0.11, -0.07],
    warpFrequency: [0.73, 0.91],
    warpSpeed: [0.17, -0.13],
    warpStrength: 0.9,
    crossFrequency: [1.17, 0.87],
    crossStrength: 0.65,
    lineWidth: 0.018,
    minimumAntialias: 0.012,
    antialiasScale: 1.5,
    haloWidth: 0.24,
    haloStrength: 0.07,
    causticIntensity: 0.38,
    edgeCausticStrength: 0.12,
    sunriseRadius: 5,
    sunriseIntensity: 0.1,
}

const RING = {
    thickness: 0.38,
    thetaSegments: 192,
    coral: '#FF7A59',
    gold: '#FFD27A',
    teal: '#4FE3D6',
    head: '#FFF4DC',
    trackIntensity: 0.55,
    trackOpacity: 0.12,
    activeIntensity: 4.2,
    activeOpacity: 0.96,
    minimumAntialias: 0.002,
    headLength: 0.42,
    headWidth: 0.4,
    headFalloff: 2.5,
    headIntensity: 5,
    headFadeIn: 0.006,
    pulseSpeed: 1.6,
    pulseAmplitude: 0.06,
    pulseBase: 0.94,
}

export const isTideLoading = WORLD_CONFIG.loadingStyle === 'tide'
export const TIDE_REVEAL = { color: '#FFC46B', intensity: 4.5 }
export const TIDE_LABEL = '#F5FCFF'

function causticPattern(offset, time)
{
    const point = offset.mul(SEA.patternScale).add(time.mul(vec2(...SEA.drift))).toVar()
    const warp = vec2(
        point.y.mul(SEA.warpFrequency[0]).add(time.mul(SEA.warpSpeed[0])).sin(),
        point.x.mul(SEA.warpFrequency[1]).add(time.mul(SEA.warpSpeed[1])).cos(),
    )
    const warped = point.add(warp.mul(SEA.warpStrength)).toVar()
    const first = warped.x.add(warped.y.mul(SEA.crossFrequency[0]).sin().mul(SEA.crossStrength)).sin().abs()
    const second = warped.y.add(warped.x.mul(SEA.crossFrequency[1]).cos().mul(SEA.crossStrength)).sin().abs()
    const distance = first.min(second).toVar()
    const antialias = fwidth(distance).max(SEA.minimumAntialias).mul(SEA.antialiasScale)
    const core = distance.smoothstep(SEA.lineWidth, antialias.add(SEA.lineWidth)).oneMinus()
    const halo = distance.smoothstep(SEA.lineWidth, SEA.haloWidth).oneMinus().mul(SEA.haloStrength)
    return core.add(halo)
}

function seaColor(offset, time)
{
    const distance = offset.length().toVar()
    const depth = distance.smoothstep(SEA.gradientStart, SEA.gradientEnd).toVar()
    const base = mix(color(SEA.center), color(SEA.edge), depth)
    const causticFade = mix(float(1), float(SEA.edgeCausticStrength), depth)
    const caustics = color(SEA.caustic).mul(causticPattern(offset, time)).mul(causticFade).mul(SEA.causticIntensity)
    const glow = distance.div(SEA.sunriseRadius).pow(2).negate().exp()
    const sunrise = color(SEA.sunrise).mul(glow).mul(SEA.sunriseIntensity)
    return base.add(caustics).add(sunrise)
}

export function tideSeaMaterial(game)
{
    const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide })
    material.outputNode = Fn(() =>
    {
        const offset = positionWorld.xz.sub(game.reveal.position2Uniform).toVar()
        offset.length().lessThan(game.reveal.distance).discard()
        return vec4(seaColor(offset, game.ticker.elapsedUniform), 1)
    })()
    return material
}

export function tideRingGeometry(radius)
{
    return new THREE.RingGeometry(radius - RING.thickness, radius, RING.thetaSegments, 1)
}

function ringGradient(angleProgress)
{
    const warm = mix(color(RING.coral), color(RING.gold), angleProgress.mul(2).clamp(0, 1))
    return mix(warm, color(RING.teal), angleProgress.sub(0.5).mul(2).clamp(0, 1))
}

function ringEdge(across)
{
    const antialias = fwidth(across).max(RING.minimumAntialias)
    return across.smoothstep(0, antialias).mul(across.smoothstep(antialias.oneMinus(), 1).oneMinus())
}

function ringHead({ angleProgress, completion, across, radius })
{
    const separation = angleProgress.sub(completion).abs()
    const along = separation.min(separation.oneMinus()).mul(TWO_PI).mul(radius - RING.thickness * 0.5).div(RING.headLength)
    const radial = across.sub(0.5).div(RING.headWidth)
    const glow = along.mul(along).add(radial.mul(radial)).mul(-RING.headFalloff).exp()
    return glow.mul(completion.smoothstep(0, RING.headFadeIn))
}

export function tideRingMaterial(progress, radius, game)
{
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide })
    material.outputNode = Fn(() =>
    {
        const completion = progress.clamp(0, 1).toVar()
        const angleProgress = atan(positionGeometry.y, positionGeometry.x).div(TWO_PI).add(0.5).oneMinus().toVar()
        const across = positionGeometry.xy.length().sub(radius - RING.thickness).div(RING.thickness).toVar()
        const filled = angleProgress.lessThan(completion).select(1, 0).toVar()
        const head = ringHead({ angleProgress, completion, across, radius }).toVar()
        const pulse = game.ticker.elapsedUniform.mul(RING.pulseSpeed).sin().mul(RING.pulseAmplitude).add(RING.pulseBase)
        const track = color(RING.teal).mul(RING.trackIntensity)
        const active = ringGradient(angleProgress).mul(RING.activeIntensity).mul(pulse)
        const light = mix(track, active, filled).add(color(RING.head).mul(head).mul(RING.headIntensity))
        const opacity = mix(float(RING.trackOpacity), float(RING.activeOpacity), filled).max(head).mul(ringEdge(across))
        return vec4(light, opacity)
    })()
    return material
}
