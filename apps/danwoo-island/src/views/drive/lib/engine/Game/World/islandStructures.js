import * as THREE from 'three/webgpu'
import { Fn, max, texture, uv, vec4 } from 'three/tsl'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'
import { bungeoppangGeometry, createParts, FULL_TURN, seededRandom } from './islandGeometry.js'
import { islandModelMesh } from './islandModels.js'

const OBANG = ['obangBlue', 'obangRed', 'obangYellow', 'obangWhite', 'obangBlack']

function cuboidFrame(cuboid)
{
    return {
        size: cuboid.scale.clone(),
        matrix: new THREE.Matrix4().compose(cuboid.position, cuboid.quaternion, new THREE.Vector3(1, 1, 1)),
    }
}

function findChild(parent, name)
{
    const child = parent.children.find((item) => item.name === name)
    if(!child)
        throw new Error(`월드 모델에서 ${name}을 찾지 못했어요.`)
    return child
}

function swapForGroup(target)
{
    const replacement = new THREE.Object3D()
    replacement.name = target.name
    replacement.position.copy(target.position)
    replacement.quaternion.copy(target.quaternion)
    replacement.scale.copy(target.scale)
    replacement.userData = { ...target.userData }
    for(const child of [...target.children])
        replacement.add(child)
    target.parent.add(replacement)
    target.removeFromParent()
    return replacement
}

function replaceVisual(parent, name, build)
{
    const target = findChild(parent, name)
    const container = target.isMesh ? swapForGroup(target) : target
    container.add(build(container))
    return container
}

function giwaRoof(parts, { center, width, depth, height })
{
    const [x, y, z] = center
    parts.box('woodDark', [width + 0.2, 0.14, depth + 0.2], { position: [x, y, z] })
    parts.hipRoof('giwa', { width: width + 0.4, depth: depth + 0.4, height, position: [x, y + 0.07, z] })
    const ridgeHalf = ((width + 0.4) * 0.55) / 2
    parts.box('giwaRidge', [ridgeHalf * 2 + 0.3, 0.16, 0.22], { position: [x, y + 0.07 + height, z] })
    for(const side of [-1, 1])
        parts.box('giwaRidge', [0.22, 0.34, 0.22], { position: [x + side * (ridgeHalf + 0.15), y + 0.2 + height, z] })
    const courses = Math.max(4, Math.round(width / 0.45))
    for(let index = 1; index < courses; index++)
    {
        const eaveX = x - (width + 0.4) / 2 + ((width + 0.4) * index) / courses
        const ridgeX = x + (eaveX - x) * 0.55
        for(const side of [-1, 1])
            parts.rod('giwaRidge', 0.035, [eaveX, y + 0.1, z + side * ((depth + 0.4) / 2)], [ridgeX, y + 0.07 + height, z])
    }
    for(const sideX of [-1, 1])
        for(const sideZ of [-1, 1])
            parts.box('giwaRidge', [0.5, 0.12, 0.2], {
                position: [x + sideX * ((width + 0.4) / 2), y + 0.14, z + sideZ * ((depth + 0.4) / 2)],
                rotation: [0, sideX * sideZ * 0.8, sideX * 0.35],
            })
}

function thatchRoof(parts, { center, width, depth, height })
{
    const [x, y, z] = center
    parts.add('thatch', new THREE.SphereGeometry(1, 12, 5, 0, FULL_TURN, 0, Math.PI / 2), {
        position: [x, y, z],
        scale: [width / 2, height, depth / 2],
    })
    parts.add('thatchRope', new THREE.TorusGeometry(1, 0.03, 4, 16), {
        position: [x, y + height * 0.35, z],
        rotation: [Math.PI / 2, 0, 0],
        scale: [(width / 2) * 0.94, (depth / 2) * 0.94, 1],
    })
    parts.add('thatch', new THREE.SphereGeometry(1, 8, 4), { position: [x, y + height * 0.98, z], scale: [width * 0.12, height * 0.16, depth * 0.12] })
}

function dancheongBeam(parts, { from, to, y, z, depth = 0.42 })
{
    const length = to - from
    const center = (from + to) / 2
    parts.box('dancheongGreen', [length, 0.32, depth], { position: [center, y, z] })
    for(const end of [from + 0.35, to - 0.35])
    {
        parts.box('dancheongRed', [0.18, 0.34, depth + 0.02], { position: [end, y, z] })
        parts.box('dancheongBlue', [0.1, 0.34, depth + 0.02], { position: [end + (end < center ? 0.2 : -0.2), y, z] })
    }
}

function pillar(parts, material, { x, z, bottom, top, radius = 0.2 })
{
    parts.box('stone', [radius * 3, 0.28, radius * 3], { position: [x, bottom + 0.14, z] })
    parts.prism(material, radius, radius * 1.05, top - bottom - 0.28, { position: [x, (bottom + 0.28 + top) / 2, z] })
}

export function rebuildProjectsGate(model, materials)
{
    replaceVisual(model, 'Cube065', () =>
    {
        const parts = createParts()
        const ground = -0.13
        const top = 3.75
        for(const [x, z] of [[-2.25, 0], [2.25, 0], [4.6, 1.5]])
            pillar(parts, 'pillarRed', { x, z, bottom: ground, top })
        dancheongBeam(parts, { from: -2.6, to: 2.6, y: top - 0.1, z: 0 })
        parts.box('pillarRed', [2.4, 0.22, 0.3], { position: [3.45, top - 0.6, 0.75], rotation: [0, -0.57, 0] })
        giwaRoof(parts, { center: [0, top + 0.1, 0], width: 5.6, depth: 1.8, height: 0.9 })
        giwaRoof(parts, { center: [4.6, top - 0.35, 1.5], width: 1.1, depth: 1.1, height: 0.55 })
        return parts.build(materials)
    })
}

export function rebuildLabGate(model, materials)
{
    replaceVisual(model, 'Cube003', () =>
    {
        const parts = createParts()
        const ground = -1.82
        const top = 2.95
        for(const x of [-2.25, 2.25, 5.1])
            pillar(parts, 'wood', { x, z: 0.25, bottom: ground, top, radius: 0.22 })
        parts.box('woodDark', [7.9, 0.3, 0.4], { position: [1.42, top, 0.25] })
        parts.rod('woodDark', 0.08, [-2.25, top - 1.0, 0.25], [-1.35, top - 0.1, 0.25])
        parts.rod('woodDark', 0.08, [2.25, top - 1.0, 0.25], [1.35, top - 0.1, 0.25])
        thatchRoof(parts, { center: [1.42, top + 0.12, 0.25], width: 9, depth: 2.8, height: 1.15 })
        return parts.build(materials)
    })
}

const MAP_ASPECT = 1.5
const KIOSK_ROOF_GROOVES = 6
const MAP_BACKING_DEPTH = 0.01

function guideMap(board, mapTexture, { width, height, y, z })
{
    const geometry = new THREE.PlaneGeometry(width, height)
    geometry.translate(0, y, z)
    geometry.applyMatrix4(board.matrix)
    const material = new MeshDefaultMaterial({ colorNode: texture(mapTexture).rgb, hasCoreShadows: false, hasDropShadows: false })
    material.userData.prevent = true
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = 'guideMap'
    mesh.receiveShadow = true
    return mesh
}

export function rebuildKiosk(model, materials, mapTexture)
{
    replaceVisual(model, 'physicalFixed009', (container) =>
    {
        const board = cuboidFrame(container.children.find((child) => child.name === 'cuboid018'))
        const { x: W, y: H, z: D } = board.size
        const at = (t) => (t - 0.5) * H
        const frame = { matrix: board.matrix }
        const parts = createParts()
        for(const side of [-1, 1])
        {
            parts.add('stoneDark', new THREE.CylinderGeometry(0.5, 0.5, 1, 8), { scale: [0.16 * W, 0.07 * H, 0.9 * D], position: [side * 0.4 * W, at(0.045), 0], ...frame })
            parts.box('woodDark', [0.075 * W, 0.84 * H, 0.36 * D], { position: [side * 0.4 * W, at(0.49), 0], ...frame })
        }
        parts.box('wood', [0.75 * W, 0.51 * H, 0.23 * D], { position: [0, at(0.49), 0.04 * D], ...frame })
        parts.box('hanji', [0.7 * W, 0.46 * H, MAP_BACKING_DEPTH], { position: [0, at(0.49), 0.16 * D], ...frame })
        parts.box('woodDark', [0.98 * W, 0.012 * H, 0.96 * D], { position: [0, at(0.91), 0], ...frame })
        const roofHeight = Math.min(0.06 * H, 0.28 * D)
        const roofBase = at(0.916)
        parts.hipRoof('giwa', { width: 0.98 * W, depth: 0.96 * D, height: roofHeight, ridgeRatio: 0.6, position: [0, roofBase, 0], ...frame })
        parts.box('giwaRidge', [0.62 * W, 0.018 * H, 0.15 * D], { position: [0, roofBase + roofHeight, 0], ...frame })
        for(let index = 0; index < KIOSK_ROOF_GROOVES; index++)
        {
            const x = -0.4 * W + (index * 0.8 * W) / (KIOSK_ROOF_GROOVES - 1)
            for(const side of [-1, 1])
            {
                const eave = new THREE.Vector3(x, roofBase + 0.01, side * 0.46 * D).applyMatrix4(board.matrix)
                const ridge = new THREE.Vector3(x * 0.62, roofBase + roofHeight, side * 0.04 * D).applyMatrix4(board.matrix)
                parts.rod('giwaRidge', 0.012 * D, eave.toArray(), ridge.toArray(), 4)
            }
        }
        const group = parts.build(materials)
        const mapWidth = Math.min(0.68 * W, 0.43 * H * MAP_ASPECT)
        group.add(guideMap(board, mapTexture, { width: mapWidth, height: mapWidth / MAP_ASPECT, y: at(0.49), z: 0.16 * D + MAP_BACKING_DEPTH }))
        return group
    })
}

const POJANGMACHA = {
    molds: [[-1.45, -0.55], [-0.8, -0.55], [-0.15, -0.55], [-1.45, -0.05], [-0.8, -0.05], [-0.15, -0.05]],
    roof: { center: [-0.8, 2.55, -0.45], width: 3.8, depth: 3.0, height: 0.75 },
    flapTop: 2.5,
    bulbs: 5,
}

function pojangmachaTent(parts)
{
    const { roof, flapTop, bulbs } = POJANGMACHA
    const [centerX, , centerZ] = roof.center
    parts.hipRoof('tarpOrange', { ...roof, ridgeRatio: 0.7, position: roof.center })
    const front = centerZ + roof.depth / 2 - 0.12
    parts.box('tarpOrange', [roof.width, 0.35, 0.03], { position: [centerX, flapTop - 0.1, front + 0.1] })
    for(let index = 0; index < bulbs; index++)
    {
        const x = centerX - roof.width * 0.4 + (index * roof.width * 0.8) / (bulbs - 1)
        parts.rod('ink', 0.008, [x, flapTop + 0.02, front], [x, flapTop - 0.25, front])
        parts.add('lantern', new THREE.SphereGeometry(0.09, 8, 6), { position: [x, flapTop - 0.32, front] })
    }
    parts.rod('ink', 0.01, [centerX - roof.width * 0.42, flapTop + 0.02, front], [centerX + roof.width * 0.42, flapTop + 0.02, front])
}

export function rebuildCookieCart(model, materials)
{
    const container = findChild(model, 'cookiePhysicalFixed')
    findChild(container, 'Cube135').removeFromParent()
    const parts = createParts()
    const bottom = -1.8
    const counterTop = -0.8
    parts.box('wood', [3.15, counterTop - bottom - 0.2, 2.2], { position: [-0.8, (bottom + counterTop) / 2 + 0.1, -0.46] })
    parts.box('woodDark', [3.3, 0.1, 2.34], { position: [-0.8, counterTop - 0.05, -0.46] })
    for(const z of [-1.62, 0.7])
    {
        parts.prism('woodDark', 0.48, 0.48, 0.12, { position: [-0.8, bottom + 0.48, z], rotation: [Math.PI / 2, 0, 0] }, 10)
        parts.prism('wood', 0.12, 0.12, 0.16, { position: [-0.8, bottom + 0.48, z], rotation: [Math.PI / 2, 0, 0] }, 6)
    }
    parts.box('iron', [1.8, 0.2, 1.1], { position: [-0.8, counterTop + 0.1, -0.3] })
    for(const [x, z] of POJANGMACHA.molds)
    {
        parts.box('metalDark', [0.5, 0.05, 0.3], { position: [x, counterTop + 0.22, z] })
        parts.add('bungeoppang', bungeoppangGeometry(), { position: [x, counterTop + 0.27, z], scale: [0.62, 0.62, 0.62] })
    }
    parts.box('woodDark', [2.02, 0.12, 2.1], { position: [-0.8, -0.03, -0.91] })
    parts.box('woodDark', [2.02, 0.12, 2.1], { position: [-0.8, 1.64, -0.91] })
    for(const x of [-1.75, 0.15])
        for(const z of [-1.9, 0.08])
            parts.box('woodDark', [0.1, 1.7, 0.1], { position: [x, 0.81, z] })
    parts.box('wood', [1.86, 1.46, 1.86], { position: [-0.8, 0.81, -0.91] })
    for(const z of [-1.86, 0.04])
        parts.box('glass', [1.6, 1.1, 0.04], { position: [-0.8, 0.86, z] })
    for(const x of [-2.35, 0.75])
        for(const z of [-1.55, 0.65])
            parts.rod('woodDark', 0.05, [x, counterTop, z], [x, 2.55, z])
    pojangmachaTent(parts)
    parts.rod('woodDark', 0.11, [4.71, bottom, 0.22], [4.71, 2.5, 0.22], 6)
    container.add(parts.build(materials))
}

export function rebuildOuthouse(model, materials)
{
    const container = findChild(model, 'refCabinPhysicalDynamic')
    findChild(container, 'wood002').removeFromParent()
    const parts = createParts()
    const bottom = -1.9
    const top = 1.3
    const height = top - bottom
    parts.box('stone', [1.9, 0.18, 1.85], { position: [0, bottom + 0.09, -0.04] })
    for(const x of [-0.82, 0.82])
        for(const z of [-0.82, 0.74])
            parts.box('woodDark', [0.16, height, 0.16], { position: [x, bottom + height / 2, z] })
    parts.box('wood', [0.08, height - 0.3, 1.5], { position: [-0.84, bottom + height / 2, -0.04] })
    parts.box('wood', [0.08, height - 0.3, 1.5], { position: [0.84, bottom + height / 2, -0.04] })
    parts.box('wood', [1.6, height - 0.3, 0.08], { position: [0, bottom + height / 2, -0.86] })
    for(let index = 0; index < 4; index++)
        parts.box('wood', [0.36, height - 0.4, 0.07], { position: [-0.57 + index * 0.38, bottom + height / 2 - 0.05, 0.74] })
    for(const y of [bottom + 0.7, top - 0.75])
        parts.box('woodDark', [1.5, 0.12, 0.05], { position: [0, y, 0.79] })
    parts.prism('iron', 0.07, 0.07, 0.05, { position: [0.48, bottom + height / 2 - 0.2, 0.8], rotation: [Math.PI / 2, 0, 0] }, 8)
    thatchRoof(parts, { center: [0, top, -0.04], width: 3.1, depth: 3.0, height: 0.7 })
    container.add(parts.build(materials))
}

export function rebuildBridge(bridge, materials)
{
    const replacement = swapForGroup(bridge)
    const deck = replacement.children.find((child) => child.name.match(/^cuboid/) && child.scale.x > 3)
    const parts = createParts()
    const top = deck.position.y + deck.scale.y / 2
    const halfWidth = deck.scale.x / 2
    const front = deck.position.z - deck.scale.z / 2
    const back = deck.position.z + deck.scale.z / 2
    const planks = Math.round((back - front) / 0.46)
    for(let index = 0; index < planks; index++)
        parts.box('wood', [halfWidth * 2, 0.14, 0.42], { position: [deck.position.x, top - 0.07, front + 0.23 + index * ((back - front - 0.46) / (planks - 1))] })
    for(const x of [-halfWidth + 0.5, halfWidth - 0.5])
        parts.box('woodDark', [0.3, 0.32, back - front], { position: [x, top - 0.3, deck.position.z] })
    const railStart = front + 0.6
    const railEnd = back - 1.15
    const posts = 6
    for(const side of [-1, 1])
    {
        const x = side * 2.09
        for(let index = 0; index < posts; index++)
        {
            const z = railStart + (index * (railEnd - railStart)) / (posts - 1)
            parts.prism('woodDark', 0.1, 0.11, 1.05, { position: [x, top + 0.52, z] })
            parts.add('wood', new THREE.SphereGeometry(0.13, 6, 4), { position: [x, top + 1.1, z] })
        }
        parts.rod('wood', 0.07, [x, top + 0.95, railStart], [x, top + 0.95, railEnd], 6)
        parts.rod('wood', 0.05, [x, top + 0.5, railStart], [x, top + 0.5, railEnd], 6)
        for(const z of [front - 0.1, back + 0.1])
            parts.box('stone', [0.7, 0.5, 0.8], { position: [x, top - 0.3, z] })
    }
    replacement.add(parts.build(materials))
}

function cairn(parts, random, { size, matrix })
{
    const layers = Math.max(3, Math.round(size.y / 0.7))
    let y = -size.y / 2
    for(let index = 0; index < layers; index++)
    {
        const shrink = 1 - (index / layers) * 0.65
        const height = (size.y / layers) * (0.9 + random() * 0.2)
        parts.add(index % 2 === 0 ? 'stone' : 'stoneDark', new THREE.IcosahedronGeometry(1, 0), {
            position: [(random() - 0.5) * 0.12, y + height / 2, (random() - 0.5) * 0.12],
            rotation: [0, random() * FULL_TURN, 0],
            scale: [(size.x / 2) * shrink, height / 2, (size.z / 2) * shrink],
            matrix,
        })
        y += height
    }
}

function geumjul(parts, random, points)
{
    for(let index = 0; index < points.length - 1; index++)
    {
        const start = points[index]
        const end = points[index + 1]
        const middle = start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, -0.6, 0))
        const segments = [[start, middle], [middle, end]]
        for(const [from, to] of segments)
        {
            parts.rod('thatchRope', 0.05, from.toArray(), to.toArray(), 5)
            const strips = Math.round(from.distanceTo(to) / 0.45)
            for(let strip = 1; strip < strips; strip++)
            {
                const anchor = from.clone().lerp(to, strip / strips)
                parts.box(OBANG[Math.floor(random() * OBANG.length)], [0.16, 0.55, 0.03], {
                    position: [anchor.x, anchor.y - 0.3, anchor.z],
                    rotation: [0, random() * FULL_TURN, 0],
                })
            }
        }
    }
}

export function rebuildSeonangdang(model, materials)
{
    findChild(model, 'Cube173').removeFromParent()
    findChild(model, 'refSkullEyes5').removeFromParent()
    const container = findChild(model, 'physicalFixed005')
    const random = seededRandom(23)
    const parts = createParts()
    const ground = container.children.find((child) => child.name.match(/^trimesh/))
    const groundGeometry = ground.geometry.clone()
    ground.updateMatrix()
    parts.add('earth', groundGeometry, { matrix: ground.matrix })
    const pillars = container.children
        .filter((child) => child.name.match(/^cuboid/))
        .map(cuboidFrame)
        .sort((a, b) => b.size.y - a.size.y)
    const tall = pillars.slice(0, 3)
    for(const frame of tall)
        cairn(parts, random, frame)
    const generals = ['jangseungHeaven', 'jangseungEarth']
    const figures = pillars.slice(3).map(({ size, matrix }, index) => islandModelMesh(materials, generals[index % generals.length], matrix, size))
    const ropePoints = tall.map((frame) => new THREE.Vector3().setFromMatrixPosition(frame.matrix).add(new THREE.Vector3(0, frame.size.y * 0.32, 0)))
    ropePoints.sort((a, b) => Math.atan2(a.z, a.x) - Math.atan2(b.z, b.x))
    geumjul(parts, random, ropePoints)
    container.add(parts.build(materials), ...figures)
}

function removeVisualMeshes(container)
{
    for(const child of container.children.filter((item) => item.isMesh && !/^(cuboid|hull|trimesh|tube|ball)/i.test(item.name)))
        child.removeFromParent()
}

function boulderStack(parts, random, { size, matrix }, shades = ['fieldstone', 'stoneDark'])
{
    const layers = Math.max(1, Math.round(size.y / 1.3))
    const layerHeight = size.y / layers
    for(let index = 0; index < layers; index++)
        parts.add(shades[index % shades.length], new THREE.IcosahedronGeometry(1, 0), {
            position: [(random() - 0.5) * 0.15, -size.y / 2 + layerHeight * (index + 0.5), (random() - 0.5) * 0.15],
            rotation: [0, random() * FULL_TURN, 0],
            scale: [(size.x / 2) * 1.12, (layerHeight / 2) * 1.2, (size.z / 2) * 1.12],
            matrix,
        })
}

function stonePagoda(parts, { x, y, z })
{
    parts.box('stone', [2.0, 0.32, 2.0], { position: [x, y + 0.16, z] })
    parts.box('stone', [1.6, 0.28, 1.6], { position: [x, y + 0.46, z] })
    let level = y + 0.6
    for(const [width, height] of [[0.95, 0.62], [0.75, 0.36], [0.62, 0.32]])
    {
        parts.box('stone', [width, height, width], { position: [x, level + height / 2, z] })
        level += height
        parts.box('stoneDark', [width + 0.75, 0.12, width + 0.75], { position: [x, level + 0.06, z] })
        for(const sideX of [-1, 1])
            for(const sideZ of [-1, 1])
                parts.box('stoneDark', [0.2, 0.08, 0.2], { position: [x + sideX * (width + 0.68) / 2, level + 0.13, z + sideZ * (width + 0.68) / 2] })
        level += 0.12
    }
    parts.prism('stoneDark', 0.1, 0.16, 0.25, { position: [x, level + 0.12, z] })
    parts.add('stone', new THREE.IcosahedronGeometry(0.1, 0), { position: [x, level + 0.32, z] })
}

function largestCuboid(container)
{
    return container.children
        .filter((child) => /^cuboid/.test(child.name))
        .map(cuboidFrame)
        .sort((a, b) => b.size.x * b.size.y * b.size.z - a.size.x * a.size.y * a.size.z)[0]
}

export function rebuildHareubang(model, materials)
{
    replaceVisual(model, 'refStatuePhysicalDynamic', (container) => islandModelMesh(materials, 'hareubang', largestCuboid(container).matrix))
}

export function rebuildWaterfallPagoda(model, materials)
{
    findChild(model, 'Cube089').removeFromParent()
    const container = findChild(model, 'physicalFixed008')
    const random = seededRandom(31)
    const parts = createParts()
    for(const cuboid of container.children.filter((child) => /^cuboid/.test(child.name)))
    {
        const frame = cuboidFrame(cuboid)
        const isPillarColumn = Math.hypot(cuboid.position.x, cuboid.position.z) < 0.1 && frame.size.y > 3
        if(isPillarColumn)
            continue
        if(frame.size.y > 3)
            boulderStack(parts, random, frame)
        else if(frame.size.y <= 0.2)
            parts.box('stone', [frame.size.x, 0.2, frame.size.z], { matrix: frame.matrix })
        else
            parts.box(frame.size.x < 0.5 ? 'stoneDark' : 'stone', [frame.size.x, frame.size.y, frame.size.z], { matrix: frame.matrix })
    }
    const hull = container.children.find((child) => /^hull/.test(child.name))
    hull.updateMatrix()
    parts.add('fieldstone', hull.geometry.clone(), { matrix: hull.matrix })
    hull.geometry.computeBoundingBox()
    const top = hull.geometry.boundingBox.clone().applyMatrix4(hull.matrix)
    stonePagoda(parts, { x: (top.min.x + top.max.x) / 2, y: top.max.y - 0.1, z: (top.min.z + top.max.z) / 2 })
    container.add(parts.build(materials))
}

function neonMaterial(game, neonTexture)
{
    neonTexture.colorSpace = THREE.SRGBColorSpace
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false })
    material.outputNode = Fn(() =>
    {
        const sample = texture(neonTexture, uv())
        const glow = vec4(sample.rgb.mul(2.2), max(sample.r, max(sample.g, sample.b)))
        return MeshDefaultMaterial.revealDiscardNodeBuilder(game, glow)
    })()
    material.fog = false
    material.userData.prevent = true
    return material
}

export function rebuildBowlingSign(model, materials, neonTexture)
{
    findChild(model, 'sign001').removeFromParent()
    const sign = swapForGroup(findChild(model, 'sign002'))
    const parts = createParts()
    parts.box('neonBoard', [4.0, 2.05, 0.12], { position: [0.05, -0.04, -0.08] })
    for(const side of [-1, 1])
        parts.box('metalDark', [0.14, 4.4, 0.14], { position: [side * 1.6, -3.1, -0.12] })
    const group = parts.build(materials)
    const neon = new THREE.Mesh(new THREE.PlaneGeometry(3.86, 1.9), neonMaterial(materials.game, neonTexture))
    neon.name = 'neon'
    neon.position.set(0.05, -0.04, 0.0)
    group.add(neon)
    sign.add(group)
}

export function rebuildRadioCabinet(model, materials)
{
    const container = findChild(model, 'refJukeboxPhysicalDynamic')
    removeVisualMeshes(container)
    const collider = cuboidFrame(container.children.find((child) => /^cuboid/.test(child.name)))
    const { x: width, y: height, z: depth } = collider.size
    const frame = { matrix: collider.matrix }
    const parts = createParts()
    parts.box('cabinetWood', [width - 0.1, height - 0.36, depth - 0.1], { position: [0, -0.06, 0], ...frame })
    parts.box('woodDark', [width, 0.12, depth], { position: [0, height / 2 - 0.18, 0], ...frame })
    for(const x of [-1, 1])
        for(const z of [-1, 1])
            parts.box('woodDark', [0.16, 0.24, 0.16], { position: [x * (width / 2 - 0.2), -height / 2 + 0.12, z * (depth / 2 - 0.2)], ...frame })
    parts.box('grille', [width - 0.6, height * 0.4, 0.04], { position: [0, -height * 0.18, depth / 2 - 0.03], ...frame })
    for(let index = 0; index < 5; index++)
        parts.box('cabinetWood', [width - 0.6, 0.03, 0.05], { position: [0, -height * 0.36 + index * (height * 0.09), depth / 2 - 0.01], ...frame })
    parts.box('lantern', [width - 1.0, 0.36, 0.04], { position: [0, height * 0.18, depth / 2 - 0.03], ...frame })
    for(const x of [-0.75, 0.75])
        parts.prism('woodDark', 0.13, 0.13, 0.08, { position: [x, height * 0.02, depth / 2], rotation: [Math.PI / 2, 0, 0], ...frame }, 10)
    container.add(parts.build(materials))
}

function timberPile(parts, { size, matrix })
{
    const layers = 4
    const beam = size.y / layers
    for(let layer = 0; layer < layers; layer++)
        for(const offset of [-1, 0, 1])
            parts.box('timber', [size.x, beam * 0.9, size.z / 3.3], {
                position: [0, -size.y / 2 + beam * (layer + 0.5), offset * (size.z / 3.1) + (layer % 2) * 0.04],
                matrix,
            })
    for(const x of [-size.x * 0.3, size.x * 0.3])
        parts.box('thatchRope', [0.06, size.y + 0.02, size.z + 0.04], { position: [x, 0, 0], matrix })
}

function hangingLantern(parts, { matrix, z, y })
{
    parts.box('woodDark', [0.02, 0.1, 0.02], { position: [0, y + 0.17, z], matrix })
    for(const [shade, offsetY, height] of [['silkRed', 0.0, 0.24], ['silkBlue', -0.2, 0.16]])
        parts.box(shade, [0.26, height, 0.26], { position: [0, y + offsetY, z], matrix })
    parts.box('cheongsachorong', [0.28, 0.25, 0.28], { position: [0, y, z], matrix })
}

export function rebuildBuildingSite(model, materials)
{
    for(const generator of model.children.filter((child) => /^lightGeneratorPhysicalDynamic/.test(child.name)))
    {
        removeVisualMeshes(generator)
        const cuboids = generator.children.filter((child) => /^cuboid/.test(child.name)).map(cuboidFrame).sort((a, b) => b.size.y - a.size.y)
        const pole = cuboids[0]
        const pile = cuboids.find((frame) => frame !== pole && frame.size.x > 1)
        const crossbar = cuboids.find((frame) => frame !== pole && frame !== pile)
        const parts = createParts()
        timberPile(parts, pile)
        parts.box('woodDark', [pole.size.x * 0.9, pole.size.y, pole.size.z * 0.9], { matrix: pole.matrix })
        parts.box('wood', [crossbar.size.x * 0.9, crossbar.size.y * 0.8, crossbar.size.z], { matrix: crossbar.matrix })
        for(const z of [-crossbar.size.z * 0.42, crossbar.size.z * 0.42])
            hangingLantern(parts, { matrix: crossbar.matrix, z, y: -0.45 })
        generator.add(parts.build(materials))
    }
    for(const cone of model.children.filter((child) => /^refObjectsPhysicalDynamic/.test(child.name)))
    {
        replaceVisual(model, cone.name, () =>
        {
            const parts = createParts()
            parts.box('stoneDark', [0.85, 0.1, 0.85], { position: [0, -0.46, 0] })
            for(let index = 0; index < 6; index++)
                parts.add('giwa', new THREE.CylinderGeometry(0.3, 0.3, 0.62, 8, 1, false, 0, Math.PI), {
                    position: [0, -0.38 + index * 0.15, 0],
                    rotation: [0, index % 2 === 0 ? 0 : Math.PI / 2, Math.PI / 2],
                    scale: [1, 1, 0.55],
                })
            return parts.build(materials)
        })
    }
}
