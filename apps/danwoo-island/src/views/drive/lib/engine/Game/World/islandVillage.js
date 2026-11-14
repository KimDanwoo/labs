import * as THREE from 'three/webgpu'
import { bungeoppangGeometry, createParts, FULL_TURN, meshComponents, SHADES, seededRandom } from './islandGeometry.js'
import { propMaterial, texturedMesh } from './islandTextured.js'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'
import { color } from 'three/tsl'

const COLLIDER = /^(cuboid|hull|trimesh|tube|ball)/i
const REFERENCE = /^ref/i
const OBANG = ['obangBlue', 'obangRed', 'obangYellow', 'obangWhite', 'obangBlack']

function hasReference(object)
{
    let found = false
    object.traverse((child) =>
    {
        if(child !== object && REFERENCE.test(child.name))
            found = true
    })
    return found
}

function isReplaceable(child, { keepEmissive })
{
    if(!child.isMesh || COLLIDER.test(child.name) || REFERENCE.test(child.name) || hasReference(child))
        return false
    return !(keepEmissive && /^emissive/.test(child.material?.name ?? ''))
}

function prepare(target, { keepEmissive = true } = {})
{
    let container = target
    if(target.isMesh)
    {
        container = new THREE.Object3D()
        container.name = target.name
        container.position.copy(target.position)
        container.quaternion.copy(target.quaternion)
        container.scale.copy(target.scale)
        container.userData = { ...target.userData }
        for(const child of [...target.children])
            container.add(child)
        target.parent.add(container)
        target.removeFromParent()
    }
    for(const child of container.children.filter((item) => isReplaceable(item, { keepEmissive })))
        child.removeFromParent()
    return container
}

function frameOf(collider)
{
    const isTube = /^tube/i.test(collider.name)
    return {
        isTube,
        size: collider.scale.clone(),
        radius: collider.scale.x / 2,
        height: collider.scale.y,
        matrix: new THREE.Matrix4().compose(collider.position, collider.quaternion, new THREE.Vector3(1, 1, 1)),
    }
}

function collidersOf(container)
{
    return container.children.filter((child) => COLLIDER.test(child.name)).map(frameOf)
}

function boundsFrame(target)
{
    target.geometry.computeBoundingBox()
    const box = target.geometry.boundingBox
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    return { isTube: false, size, radius: Math.min(size.x, size.z) / 2, height: size.y, matrix: new THREE.Matrix4().makeTranslation(center) }
}

function referenceCenter(container, pattern)
{
    const centers = []
    container.updateMatrixWorld(true)
    const inverse = container.matrixWorld.clone().invert()
    container.traverse((child) =>
    {
        if(!child.isMesh || !pattern.test(child.name))
            return
        child.geometry.computeBoundingBox()
        const box = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld).applyMatrix4(inverse)
        centers.push({ center: box.getCenter(new THREE.Vector3()), bottom: box.min.y })
    })
    return centers
}

function lathe(parts, name, profile, transform, segments = 10)
{
    parts.add(name, new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), segments), transform)
}

const YUT_TABLE = {
    sticks: [{ z: -0.3, turn: -12, isFlatUp: false }, { z: -0.1, turn: 5, isFlatUp: true }, { z: 0.1, turn: -6, isFlatUp: false }, { z: 0.3, turn: 10, isFlatUp: true }],
    stickX: -0.27,
    stickLength: 0.34,
    boardX: 0.23,
}

function yutStick(parts, { x, y, z, turn, isFlatUp, length, radius, matrix })
{
    const rotation = [0, (turn * Math.PI) / 180, isFlatUp ? -Math.PI / 2 : Math.PI / 2]
    const lift = isFlatUp ? radius : 0
    parts.add('timber', new THREE.CylinderGeometry(radius, radius, length, 7, 1, false, 0, Math.PI), { position: [x, y + lift, z], rotation, matrix })
    if(!isFlatUp)
        return
    for(const offset of [-0.15, 0.15])
        parts.box('ink', [length * 0.035, 0.006, radius * 1.6], { position: [x + Math.cos(rotation[1]) * offset * length, y + lift + 0.004, z - Math.sin(rotation[1]) * offset * length], rotation: [0, rotation[1], 0], matrix })
}

function yutTable(parts, container, materials)
{
    const { size, matrix } = collidersOf(container)[0]
    const { x: W, y: H, z: D } = size
    const at = (t) => (t - 0.5) * H
    for(const sx of [-1, 1])
        for(const sz of [-1, 1])
            parts.box('woodDark', [0.08 * W, 0.3 * H, 0.12 * D], { position: [sx * 0.37 * W, at(0.15), sz * 0.34 * D], matrix })
    for(const sz of [-1, 1])
        parts.box('woodDark', [0.86 * W, 0.1 * H, 0.07 * D], { position: [0, at(0.32), sz * 0.36 * D], matrix })
    parts.box('wood', [0.94 * W, 0.1 * H, 0.9 * D], { position: [0, at(0.39), 0], matrix })
    const boardSize = Math.min(0.85 * D, 0.45 * W)
    const boardX = YUT_TABLE.boardX * W
    parts.box('thatch', [boardSize, 0.025 * H, boardSize], { position: [boardX, at(0.455), 0], matrix })
    const board = new THREE.PlaneGeometry(boardSize, boardSize)
    board.rotateX(-Math.PI / 2)
    board.translate(boardX, at(0.469), 0)
    container.add(texturedMesh(board, propMaterial(materials, 'yutBoard'), { name: 'yutBoard', matrix, castShadow: false }))
    const radius = Math.min(0.045 * D, 0.1 * H)
    for(const stick of YUT_TABLE.sticks)
        yutStick(parts, { ...stick, x: YUT_TABLE.stickX * W, y: at(0.44), z: stick.z * D, length: YUT_TABLE.stickLength * W, radius, matrix })
}

const PAENGI_PROFILE = [[0, -0.5], [0.08, -0.42], [0.55, 0.05], [0.95, 0.32], [1, 0.38], [0.9, 0.42], [0.3, 0.46], [0, 0.47]]
const PAENGI_BANDS = [{ shade: 'obangRed', y: 0.18, scale: 0.78 }, { shade: 'obangYellow', y: 0.26, scale: 0.88 }, { shade: 'obangBlue', y: 0.34, scale: 0.98 }]

function paengi(parts, container)
{
    const colliders = collidersOf(container)
    const base = colliders.find((item) => !item.isTube)
    const spinner = colliders.find((item) => item.isTube)
    if(base)
    {
        parts.box('wood', [base.size.x, base.size.y, base.size.z], { matrix: base.matrix })
        parts.rod('timber', 0.025, new THREE.Vector3(-base.size.x * 0.4, base.size.y / 2 + 0.03, -base.size.z * 0.3).applyMatrix4(base.matrix).toArray(), new THREE.Vector3(base.size.x * 0.35, base.size.y / 2 + 0.03, base.size.z * 0.2).applyMatrix4(base.matrix).toArray())
    }
    if(!spinner)
        return
    const { radius, height, matrix } = spinner
    lathe(parts, 'timber', PAENGI_PROFILE.map(([r, y]) => [r * radius, y * height]), { matrix }, 16)
    for(const { shade, y, scale } of PAENGI_BANDS)
        parts.add(shade, new THREE.TorusGeometry(radius * scale, height * 0.035, 4, 16), { position: [0, y * height, 0], rotation: [Math.PI / 2, 0, 0], matrix })
    parts.prism('woodDark', radius * 0.12, radius * 0.16, height * 0.12, { position: [0, height * 0.52, 0], matrix }, 8)
}

const JANGGU = {
    body: [[0, -0.42], [0.96, -0.42], [1, -0.36], [0.85, -0.25], [0.46, -0.1], [0.34, -0.035], [0.34, 0.035], [0.46, 0.1], [0.85, 0.25], [1, 0.36], [0.96, 0.42], [0, 0.42]],
    headX: 0.425,
    centerT: 0.48,
    cords: 8,
    tightenerX: 0.16,
}

function janggu(parts, frame)
{
    const { size, matrix } = frame
    const { x: W, y: H, z: D } = size
    const R = 0.39 * Math.min(H, D)
    const centerY = (JANGGU.centerT - 0.5) * H
    const alongX = { rotation: [0, 0, -Math.PI / 2], position: [0, centerY, 0], matrix }
    lathe(parts, 'pillarRed', JANGGU.body.map(([q, a]) => [q * R, a * W]), alongX, 12)
    const headX = JANGGU.headX * W
    for(const side of [-1, 1])
    {
        parts.prism('hanji', R, R, 0.018 * W, { position: [side * headX, centerY, 0], rotation: [0, 0, -Math.PI / 2], matrix }, 12)
        parts.add('woodDark', new THREE.TorusGeometry(R * 0.995, R * 0.04, 4, 14), { position: [side * headX, centerY, 0], rotation: [0, Math.PI / 2, 0], matrix })
        parts.box('woodDark', [0.1 * W, 0.06 * H, 0.44 * D], { position: [side * 0.25 * W, (0.08 - 0.5) * H, 0], matrix })
    }
    const ring = (x, angle) => new THREE.Vector3(x, centerY + Math.cos(angle) * R * 0.98, Math.sin(angle) * R * 0.98).applyMatrix4(matrix)
    const cord = 0.004 * Math.min(H, D)
    for(let index = 0; index < JANGGU.cords; index++)
    {
        const angle = (index / JANGGU.cords) * FULL_TURN
        const across = angle + Math.PI / JANGGU.cords
        const next = angle + FULL_TURN / JANGGU.cords
        parts.rod('hanji', cord, ring(-headX, angle).toArray(), ring(headX, across).toArray(), 4)
        parts.rod('hanji', cord, ring(headX, across).toArray(), ring(-headX, next).toArray(), 4)
        const tightener = ring(-headX, angle).lerp(ring(headX, across), 0.5 + JANGGU.tightenerX)
        parts.box('woodDark', [0.035 * W, 0.025 * H, 0.025 * D], { position: tightener.toArray() })
    }
}

function obangFlag(parts, frame)
{
    const { size, matrix } = frame
    const bottom = -size.y / 2
    parts.add('stone', new THREE.IcosahedronGeometry(1, 0), { position: [0, bottom + 0.1, 0], scale: [0.55, 0.3, 0.45], matrix })
    parts.prism('woodDark', 0.05, 0.06, size.y, { matrix }, 8)
    parts.add('obangYellow', new THREE.IcosahedronGeometry(0.09, 0), { position: [0, size.y / 2 + 0.05, 0], matrix })
    const stripeHeight = 0.22
    OBANG.forEach((shade, index) =>
        parts.box(shade, [1.1 - index * 0.14, stripeHeight, 0.03], { position: [0.6 - index * 0.07, size.y / 2 - 0.25 - index * stripeHeight, 0], matrix }))
}

function slateBoards(parts, container)
{
    for(const { size, matrix } of collidersOf(container))
    {
        parts.box('slate', [size.x * 0.7, size.y * 0.86, size.z * 0.9], { matrix })
        parts.box('wood', [size.x * 0.8, 0.08, size.z], { position: [0, size.y * 0.45, 0], matrix })
        parts.box('wood', [size.x * 0.8, 0.08, size.z], { position: [0, -size.y * 0.45, 0], matrix })
    }
}

const GRINDER_WHEEL = { halfWidth: 1.01, axleZ: 0.37, bottom: -0.96 }

function grinderStand(parts)
{
    const { halfWidth, axleZ, bottom } = GRINDER_WHEEL
    for(const side of [-1, 1])
        parts.box('woodDark', [0.18, -bottom, 0.22], { position: [side * (halfWidth + 0.14), bottom / 2, axleZ] })
    parts.box('wood', [halfWidth * 2 + 0.6, 0.22, 1.4], { position: [0, bottom + 0.11, axleZ] })
    parts.rod('iron', 0.05, [-(halfWidth + 0.24), 0, axleZ], [halfWidth + 0.24, 0, axleZ], 8)
}

function workTable(parts, frame)
{
    const { size, matrix } = frame
    const top = size.y / 2
    parts.box('wood', [size.x * 1.05, 0.12, size.z * 1.04], { position: [0, top - 0.06, 0], matrix })
    parts.box('woodDark', [size.x * 0.9, 0.14, size.z * 0.92], { position: [0, top - 0.19, 0], matrix })
    for(const x of [-1, 1])
        for(const z of [-1, 1])
            parts.box('woodDark', [0.12, size.y - 0.12, 0.12], { position: [x * (size.x / 2 - 0.1), -0.06, z * (size.z / 2 - 0.1)], matrix })
    return new THREE.Vector3().setFromMatrixPosition(matrix).y + top
}

function candleSticks(parts, container, tableTop)
{
    for(const { center, bottom } of referenceCenter(container, /^refCandleFlame/))
    {
        const height = Math.max(0.05, bottom - tableTop)
        parts.prism('obangWhite', 0.04, 0.045, height, { position: [center.x, tableTop + height / 2, center.z] }, 8)
    }
}

function waterJar(parts, frame)
{
    const { size, matrix } = frame
    const bottom = -size.y / 2
    const h = size.y
    const r = Math.min(size.x, size.z) / 2
    lathe(parts, 'onggi', [[0, bottom], [r * 0.7, bottom], [r, bottom + h * 0.45], [r * 0.8, bottom + h * 0.92], [r * 0.82, bottom + h], [0, bottom + h * 0.94]], { matrix })
    parts.prism('mapBlue', r * 0.72, r * 0.72, 0.02, { position: [0, bottom + h * 0.93, 0], matrix }, 10)
}

function anvil(parts, frame)
{
    const { size, matrix } = frame
    const bottom = -size.y / 2
    parts.prism('timber', size.x * 0.42, size.x * 0.48, 1.0, { position: [0, bottom + 0.5, 0], matrix }, 10)
    parts.box('iron', [0.5, 0.45, size.z * 0.75], { position: [0, bottom + 1.0 + 0.225, 0], matrix })
    parts.prism('iron', 0.02, 0.16, 0.42, { position: [0, bottom + 1.25, size.z * 0.48], rotation: [Math.PI / 2, 0, 0], matrix }, 8)
}

const CHARCOAL_FOOTPRINT = { x: 1.62, z: 1.52 }

function hwaro(parts, frame)
{
    const { matrix } = frame
    const size = { x: Math.max(frame.size.x, CHARCOAL_FOOTPRINT.x), y: frame.size.y, z: Math.max(frame.size.z, CHARCOAL_FOOTPRINT.z) }
    const bottom = -size.y / 2
    const top = 0.38
    const height = top - bottom
    parts.box('stone', [size.x, height * 0.3, size.z], { position: [0, bottom + height * 0.15, 0], matrix })
    for(const side of [-1, 1])
    {
        parts.box('earth', [0.16, height, size.z], { position: [side * (size.x / 2 - 0.08), bottom + height / 2, 0], matrix })
        parts.box('earth', [size.x, height, 0.14], { position: [0, bottom + height / 2, side * (size.z / 2 - 0.07)], matrix })
    }
    parts.box('stoneDark', [size.x + 0.08, 0.06, 0.18], { position: [0, top, size.z / 2 - 0.07], matrix })
    parts.box('stoneDark', [size.x + 0.08, 0.06, 0.18], { position: [0, top, -size.z / 2 + 0.07], matrix })
}

function gamasot(parts)
{
    lathe(parts, 'iron', [[0, -0.55], [0.45, -0.52], [0.82, -0.15], [0.86, 0.12], [0.66, 0.36], [0.64, 0.46], [0.56, 0.44], [0.54, 0.38], [0, 0.38]], {}, 14)
    parts.prism('iron', 1.0, 1.0, 0.06, { position: [0, 0.08, 0] }, 14)
    for(const side of [-1, 1])
        parts.box('iron', [0.18, 0.08, 0.14], { position: [side * 0.72, 0.38, 0] })
}

function bench(parts, container)
{
    const colliders = collidersOf(container).sort((a, b) => b.size.x * b.size.z - a.size.x * a.size.z)
    const [seat, back] = colliders
    const top = seat.size.y / 2
    parts.box('wood', [seat.size.x, 0.14, seat.size.z], { position: [0, top - 0.07, 0], matrix: seat.matrix })
    for(const x of [-1, 1])
        for(const z of [-1, 1])
            parts.box('woodDark', [0.14, seat.size.y - 0.14, 0.14], { position: [x * (seat.size.x / 2 - 0.12), -0.07, z * (seat.size.z / 2 - 0.12)], matrix: seat.matrix })
    if(!back)
        return
    for(const y of [-0.15, 0.2, 0.42])
        parts.box('wood', [back.size.x * 0.45, 0.14, back.size.z], { position: [0, y, 0], matrix: back.matrix })
    for(const z of [-1, 1])
        parts.box('woodDark', [back.size.x * 0.5, back.size.y, 0.12], { position: [0, 0, z * (back.size.z / 2 - 0.08)], matrix: back.matrix })
}

function logStool(parts, frame)
{
    const { size, matrix } = frame
    const radius = Math.min(size.x, size.z) * 0.45
    parts.prism('timber', radius, radius * 1.06, size.y, { matrix }, 10)
    parts.prism('grille', radius * 0.92, radius * 0.92, 0.02, { position: [0, size.y / 2 + 0.01, 0], matrix }, 10)
}

function soban(parts, container)
{
    const colliders = collidersOf(container).sort((a, b) => a.size.y - b.size.y)
    const [top, base] = colliders
    parts.prism('wood', top.size.x / 2, top.size.x / 2 - 0.05, top.size.y * 0.6, { matrix: top.matrix }, 12)
    parts.prism('woodDark', top.size.x / 2 + 0.02, top.size.x / 2 + 0.02, 0.06, { position: [0, top.size.y * 0.3, 0], matrix: top.matrix }, 12)
    if(!base)
        return
    for(let index = 0; index < 4; index++)
    {
        const angle = (index / 4) * FULL_TURN + Math.PI / 4
        parts.box('woodDark', [0.12, base.size.y, 0.12], { position: [Math.cos(angle) * base.size.x * 0.4, 0, Math.sin(angle) * base.size.z * 0.4], matrix: base.matrix })
    }
    parts.box('woodDark', [base.size.x * 0.9, 0.08, base.size.z * 0.9], { position: [0, -base.size.y / 2 + 0.2, 0], matrix: base.matrix })
}

function gochujangJar(parts, frame)
{
    const { radius, height, matrix } = frame
    const bottom = -height / 2
    lathe(parts, 'onggi', [[0, bottom], [radius * 0.8, bottom], [radius * 1.05, bottom + height * 0.45], [radius * 0.7, bottom + height * 0.78], [0, bottom + height * 0.78]], { matrix })
    parts.prism('obangRed', radius * 1.06, radius * 1.06, height * 0.08, { position: [0, bottom + height * 0.45, 0], matrix }, 10)
    parts.prism('onggiLid', radius * 0.6, radius * 0.75, height * 0.14, { position: [0, bottom + height * 0.85, 0], matrix }, 10)
}

function oilBottle(parts, frame)
{
    const { radius, height, matrix } = frame
    const bottom = -height / 2
    parts.prism('obangYellow', radius * 0.95, radius, height * 0.62, { position: [0, bottom + height * 0.31, 0], matrix }, 10)
    parts.prism('obangYellow', radius * 0.3, radius * 0.95, height * 0.18, { position: [0, bottom + height * 0.71, 0], matrix }, 10)
    parts.prism('woodDark', radius * 0.32, radius * 0.32, height * 0.16, { position: [0, bottom + height * 0.88, 0], matrix }, 8)
    parts.box('hanji', [radius * 1.2, height * 0.22, 0.02], { position: [0, bottom + height * 0.32, radius], matrix })
}

function barCounter(parts, container)
{
    for(const frame of collidersOf(container))
    {
        const { size, matrix } = frame
        if(frame.isTube)
        {
            parts.prism('cabinetWood', frame.radius, frame.radius, frame.height, { matrix }, 14)
            parts.prism('woodDark', frame.radius + 0.06, frame.radius + 0.06, 0.08, { position: [0, frame.height / 2, 0], matrix }, 14)
            continue
        }
        parts.box('cabinetWood', [size.x, size.y, size.z], { matrix })
        parts.box('woodDark', [size.x + 0.08, 0.08, size.z + 0.08], { position: [0, size.y / 2, 0], matrix })
        for(let index = 1; index < 5; index++)
            parts.box('woodDark', [0.03, size.y * 0.8, size.z + 0.01], { position: [-size.x / 2 + (index * size.x) / 5, 0, 0], matrix })
    }
}

function makgeolliBowl(parts, frame)
{
    const { radius, height, matrix } = frame
    const bottom = -height / 2
    lathe(parts, 'obangWhite', [[0, bottom], [radius * 0.5, bottom], [radius * 0.55, bottom + height * 0.1], [radius, bottom + height * 0.7], [radius * 0.95, bottom + height * 0.72], [0, bottom + height * 0.2]], { matrix }, 12)
    parts.prism('grille', radius * 0.9, radius * 0.9, 0.02, { position: [0, bottom + height * 0.62, 0], matrix }, 12)
}

function strawBale(parts, frame)
{
    const { size, matrix } = frame
    if(frame.isTube)
    {
        parts.prism('thatch', frame.radius, frame.radius, frame.height, { matrix }, 10)
        for(const y of [-0.3, 0.3])
            parts.prism('thatchRope', frame.radius + 0.02, frame.radius + 0.02, 0.06, { position: [0, frame.height * y, 0], matrix }, 10)
        return
    }
    parts.box('thatch', [size.x, size.y, size.z], { matrix })
    for(const x of [-0.3, 0.3])
        parts.box('thatchRope', [0.06, size.y + 0.02, size.z + 0.02], { position: [size.x * x, 0, 0], matrix })
}

function bigDok(parts, frame)
{
    const { radius, height, matrix } = frame
    const bottom = -height / 2
    lathe(parts, 'onggi', [[0, bottom], [radius * 0.65, bottom], [radius, bottom + height * 0.5], [radius * 0.72, bottom + height * 0.92], [0, bottom + height * 0.92]], { matrix }, 12)
    parts.prism('onggiLid', radius * 0.6, radius * 0.74, height * 0.1, { position: [0, bottom + height * 0.96, 0], matrix }, 12)
}

const TV_BODY = { halfWidth: 0.97, bottom: -1.15, top: 0.84, back: -0.5, front: 0.33 }
const TV_SCREEN = { halfWidth: 0.71, bottom: -0.68, top: 0.55 }

function tvCabinet(parts, container)
{
    const { halfWidth, bottom, top, back, front } = TV_BODY
    const depth = front - back
    parts.box('cabinetWood', [halfWidth * 2, top - bottom, depth], { position: [0, (top + bottom) / 2, (front + back) / 2] })
    const rear = collidersOf(container).find((frame) => frame.size.y < 1.5)
    if(rear)
        parts.box('woodDark', [rear.size.x * 0.8, rear.size.y * 0.9, rear.size.z * 0.95], { matrix: rear.matrix })
    const frameZ = front + 0.04
    const bar = 0.1
    parts.box('woodDark', [TV_SCREEN.halfWidth * 2 + bar * 2, bar, 0.08], { position: [0, TV_SCREEN.top + bar / 2, frameZ] })
    parts.box('woodDark', [TV_SCREEN.halfWidth * 2 + bar * 2, bar, 0.08], { position: [0, TV_SCREEN.bottom - bar / 2, frameZ] })
    for(const side of [-1, 1])
        parts.box('woodDark', [bar, TV_SCREEN.top - TV_SCREEN.bottom, 0.08], { position: [side * (TV_SCREEN.halfWidth + bar / 2), (TV_SCREEN.top + TV_SCREEN.bottom) / 2, frameZ] })
    parts.box('grille', [1.2, 0.24, 0.03], { position: [-0.12, -0.93, front + 0.015] })
    for(const y of [-0.85, -0.93, -1.01])
        parts.box('woodDark', [1.16, 0.025, 0.035], { position: [-0.12, y, front + 0.02] })
    parts.prism('iron', 0.06, 0.06, 0.06, { position: [0.79, -0.8, front + 0.03], rotation: [Math.PI / 2, 0, 0] }, 8)
    parts.box('giwa', [halfWidth * 2 + 0.12, 0.08, depth + 0.12], { position: [0, top + 0.04, (front + back) / 2] })
}

function badukBoard(parts, frame)
{
    const { size, matrix } = frame
    const legHeight = size.y * 0.4
    const slabHeight = size.y - legHeight
    const bottom = -size.y / 2
    const top = bottom + size.y
    parts.box('timber', [size.x * 0.96, slabHeight, size.z * 0.96], { position: [0, top - slabHeight / 2, 0], matrix })
    for(const x of [-1, 1])
        for(const z of [-1, 1])
            parts.box('woodDark', [0.14, legHeight, 0.14], { position: [x * size.x * 0.36, bottom + legHeight / 2, z * size.z * 0.36], matrix })
    const half = Math.min(size.x, size.z) * 0.42
    const lines = 7
    for(let index = 0; index < lines; index++)
    {
        const t = -half + (index * 2 * half) / (lines - 1)
        parts.box('ink', [half * 2, 0.012, 0.012], { position: [0, top + 0.006, t], matrix })
        parts.box('ink', [0.012, 0.012, half * 2], { position: [t, top + 0.006, 0], matrix })
    }
    const stones = [[-1, -1, 'obangBlack'], [0, 1, 'obangWhite'], [1, -2, 'obangBlack'], [2, 0, 'obangWhite'], [-2, 2, 'obangBlack']]
    const step = (2 * half) / (lines - 1)
    for(const [x, z, name] of stones)
        parts.prism(name, 0.06, 0.07, 0.035, { position: [x * step, top + 0.02, z * step], matrix }, 8)
}

function watermelonTray(parts, frame)
{
    const { size, matrix } = frame
    const bottom = -size.y / 2
    parts.box('timber', [size.x * 0.95, 0.05, size.z * 0.9], { position: [0, bottom + 0.025, 0], matrix })
    const radius = Math.min(size.z * 0.42, size.y * 1.6)
    for(const [x, turn] of [[-size.x * 0.22, 0.2], [size.x * 0.2, -0.15]])
    {
        const rind = new THREE.CylinderGeometry(radius, radius, 0.12, 10, 1, false, Math.PI, Math.PI)
        parts.add('dancheongGreen', rind, { position: [x, bottom + 0.05, 0], rotation: [Math.PI / 2, 0, turn], matrix })
        const flesh = new THREE.CylinderGeometry(radius * 0.86, radius * 0.86, 0.125, 10, 1, false, Math.PI, Math.PI)
        parts.add('obangRed', flesh, { position: [x, bottom + 0.06, 0], rotation: [Math.PI / 2, 0, turn], matrix })
    }
}

function dotjari(parts, frame)
{
    const { size, matrix } = frame
    const bottom = -size.y / 2
    parts.box('thatch', [size.x * 0.96, 0.04, size.z * 0.96], { position: [0, bottom + 0.02, 0], matrix })
    for(let index = 1; index < 6; index++)
        parts.box('thatchRope', [size.x * 0.96, 0.045, 0.03], { position: [0, bottom + 0.02, -size.z * 0.48 + (index * size.z * 0.96) / 6], matrix })
    parts.box('obangRed', [0.55, 0.12, 0.55], { position: [size.x * 0.25, bottom + 0.1, -size.z * 0.2], rotation: [0, 0.3, 0], matrix })
    parts.box('obangBlue', [0.55, 0.12, 0.55], { position: [-size.x * 0.22, bottom + 0.1, size.z * 0.18], rotation: [0, -0.2, 0], matrix })
}

function bellowsBase(parts, frame)
{
    const { size, matrix } = frame
    const bottom = -size.y / 2
    parts.box('woodDark', [size.x * 0.92, 0.2, size.z * 0.92], { position: [0, bottom + 0.15, 0], matrix })
    for(const x of [-1, 1])
        parts.box('timber', [0.14, 0.08, size.z * 0.96], { position: [x * size.x * 0.36, bottom + 0.04, 0], matrix })
}

const PIN_PROFILE = [[0, 0.02], [0.3, 0.02], [0.46, 0.55], [0.48, 0.85], [0.36, 1.45], [0.22, 1.85], [0.24, 2.2], [0.3, 2.5], [0.24, 2.8], [0, 2.92]]

function bowlingPin(parts)
{
    lathe(parts, 'obangWhite', PIN_PROFILE, {}, 10)
    parts.prism('obangRed', 0.235, 0.24, 0.12, { position: [0, 1.95, 0] }, 10)
    parts.prism('obangBlue', 0.23, 0.235, 0.08, { position: [0, 2.08, 0] }, 10)
}

function taegeukBall(parts, frame)
{
    const radius = frame.size.x / 2
    parts.add('obangRed', new THREE.SphereGeometry(radius, 12, 4, 0, FULL_TURN, 0, Math.PI / 2))
    parts.add('obangBlue', new THREE.SphereGeometry(radius, 12, 4, 0, FULL_TURN, Math.PI / 2, Math.PI / 2))
    parts.add('obangYellow', new THREE.TorusGeometry(radius * 1.005, radius * 0.06, 4, 16), { rotation: [Math.PI / 2, 0, 0] })
}

function stonePillar(parts, frame)
{
    const { size, matrix } = frame
    const bottom = -size.y / 2
    const radius = Math.min(size.x, size.z) / 2
    parts.prism('stoneDark', radius, radius, 0.28, { position: [0, bottom + 0.14, 0], matrix })
    parts.prism('stone', radius * 0.78, radius * 0.82, size.y - 0.7, { position: [0, bottom + 0.28 + (size.y - 0.7) / 2, 0], matrix })
    parts.prism('stoneDark', radius * 0.98, radius * 0.8, 0.24, { position: [0, size.y / 2 - 0.3, 0], matrix })
    parts.prism('stone', radius * 0.3, radius * 0.62, 0.18, { position: [0, size.y / 2 - 0.09, 0], matrix })
}

const PINWHEEL = { radius: 0.44, centerY: 0.25, twist: 0.16, blades: ['obangRed', 'obangBlue', 'obangYellow', 'dancheongGreen'] }

function pinwheelBlade(radius, twist)
{
    const root = [0, 0, 0]
    const edge = [radius, 0, 0]
    const tip = [radius, radius, twist]
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([...root, ...edge, ...tip, ...root, ...tip, ...edge], 3))
    return geometry
}

function pinwheel(parts)
{
    const { radius, centerY, twist, blades } = PINWHEEL
    blades.forEach((shade, index) => parts.add(shade, pinwheelBlade(radius, twist), { position: [0, centerY, 0], rotation: [0, 0, (index * Math.PI) / 2] }))
    parts.prism('obangYellow', 0.05, 0.05, 0.08, { position: [0, centerY, 0.04], rotation: [Math.PI / 2, 0, 0] }, 6)
    parts.rod('woodDark', 0.03, [0, -0.65, -0.03], [0, centerY, -0.03])
}

function sortedColliders(container)
{
    return collidersOf(container).sort((a, b) => b.size.x * b.size.y * b.size.z - a.size.x * a.size.y * a.size.z)
}

function haetae(parts, container)
{
    const [body, head] = sortedColliders(container)
    const { size, matrix } = body
    parts.box('stoneDark', [size.x, size.y * 0.18, size.z * 1.1], { position: [0, -size.y * 0.41, 0], matrix })
    parts.box('stone', [size.x * 0.8, size.y * 0.6, size.z * 0.9], { position: [0, -size.y * 0.02, 0], matrix })
    parts.box('stone', [size.x * 0.4, size.y * 0.42, size.z], { position: [size.x * 0.3, size.y * 0.25, 0], matrix })
    if(!head)
        return
    parts.box('stone', [head.size.x * 0.8, head.size.y, head.size.z], { matrix: head.matrix })
    parts.box('stoneDark', [head.size.x * 0.3, head.size.y * 1.15, head.size.z * 1.1], { position: [-head.size.x * 0.35, 0, 0], matrix: head.matrix })
    for(const z of [-1, 1])
        parts.box('ink', [0.04, 0.08, 0.08], { position: [head.size.x * 0.4, head.size.y * 0.18, z * head.size.z * 0.25], matrix: head.matrix })
}

function dongjaseok(parts, container)
{
    const [{ size, matrix }] = sortedColliders(container)
    const bottom = -size.y / 2
    const radius = Math.min(size.x, size.z) / 2
    parts.prism('stoneDark', radius * 1.1, radius * 1.15, 0.16, { position: [0, bottom + 0.08, 0], matrix })
    parts.prism('stone', radius * 0.7, radius * 0.95, size.y * 0.55, { position: [0, bottom + 0.16 + size.y * 0.275, 0], matrix })
    parts.box('stone', [radius * 0.9, 0.16, radius * 0.5], { position: [0, bottom + size.y * 0.55, radius * 0.6], matrix })
    parts.add('stone', new THREE.IcosahedronGeometry(radius * 0.72, 0), { position: [0, bottom + size.y * 0.82, 0], matrix })
    for(const x of [-1, 1])
        parts.add('stoneDark', new THREE.IcosahedronGeometry(radius * 0.22, 0), { position: [x * radius * 0.45, bottom + size.y * 0.97, 0], matrix })
}

function jindoDog(parts, container)
{
    const [body, pack] = sortedColliders(container)
    const { size, matrix } = body
    const bottom = -size.y / 2
    parts.box('jindo', [size.x * 0.75, size.y * 0.45, size.z * 0.8], { position: [0, bottom + size.y * 0.3, -size.z * 0.05], rotation: [-0.35, 0, 0], matrix })
    for(const x of [-1, 1])
        parts.box('jindo', [0.14, size.y * 0.3, 0.14], { position: [x * size.x * 0.2, bottom + size.y * 0.15, size.z * 0.32], matrix })
    parts.box('jindo', [size.x * 0.55, size.y * 0.24, size.z * 0.5], { position: [0, bottom + size.y * 0.66, size.z * 0.18], matrix })
    parts.box('earth', [size.x * 0.25, size.y * 0.1, size.z * 0.22], { position: [0, bottom + size.y * 0.62, size.z * 0.48], matrix })
    for(const x of [-1, 1])
        parts.prism('jindo', 0, 0.09, 0.2, { position: [x * size.x * 0.17, bottom + size.y * 0.86, size.z * 0.15], matrix }, 4)
    parts.prism('jindo', 0.04, 0.09, size.y * 0.35, { position: [0, bottom + size.y * 0.45, -size.z * 0.45], rotation: [-0.9, 0, 0], matrix }, 5)
    if(pack)
        parts.box('obangBlue', [pack.size.x * 0.4, pack.size.y * 0.6, Math.max(pack.size.z, 0.3)], { matrix: pack.matrix })
}

const SOCIAL_OBJECTS = [
    { pattern: /^baguiraPhysicalDynamic/, build: haetae },
    { pattern: /^boyPhysicalDynamic/, build: dongjaseok },
    { pattern: /^sudoPhysicalDynamic/, build: jindoDog },
]

const BUILDERS = [
    ...SOCIAL_OBJECTS,
    { pattern: /^gamepadPhysicalDynamic/, keepEmissive: false, build: yutTable },
    { pattern: /^phonePhysicalDynamic/, keepEmissive: false, build: paengi },
    { pattern: /^gizmoPhysicalDynamic$/, build: (parts, container) => janggu(parts, collidersOf(container)[0]) },
    { pattern: /^blackBoardPhysicalDynamic/, build: slateBoards },
    { pattern: /^grinderPhysicalDynamic$/, build: grinderStand },
    { pattern: /^(main|side)TablePhysicalDynamic/, build: (parts, container) => candleSticks(parts, container, workTable(parts, collidersOf(container)[0])) },
    { pattern: /^quenchPhysicalDynamic/, build: (parts, container) => waterJar(parts, collidersOf(container)[0]) },
    { pattern: /^refAnvilPhysicalDynamic$/, build: (parts, container) => anvil(parts, collidersOf(container)[0]) },
    { pattern: /^refOvenPhysicalDynamic$/, build: (parts, container) => hwaro(parts, collidersOf(container)[0]) },
    { pattern: /^cauldronPhysicalDynamic$/, build: (parts) => gamasot(parts) },
    { pattern: /^couchPhysicalDynamic/, build: bench },
    { pattern: /^stoolPhysicalDynamic/, build: (parts, container) => logStool(parts, collidersOf(container)[0]) },
    { pattern: /^tablePhysicalDynamic/, build: (parts, container) => (collidersOf(container).length > 1 ? soban(parts, container) : workTable(parts, collidersOf(container)[0])) },
    { pattern: /^sauceKetchupPhysicalDynamic/, build: (parts, container) => gochujangJar(parts, collidersOf(container)[0]) },
    { pattern: /^sauceMustardPhysicalDynamic/, build: (parts, container) => oilBottle(parts, collidersOf(container)[0]) },
    { pattern: /^barPhysicalDynamic/, build: barCounter },
    { pattern: /^cupPhysicalDynamic/, build: (parts, container) => makgeolliBowl(parts, collidersOf(container)[0]) },
    { pattern: /^refTvPhysicalDynamic$/, build: tvCabinet },
    { pattern: /^blowerPhysicalDynamic/, build: (parts, container) => bellowsBase(parts, collidersOf(container)[0]) },
    { pattern: /^refPinPhysicalDynamic$/, build: (parts) => bowlingPin(parts) },
    { pattern: /^refBallPhysicalDynamic$/, build: (parts, container) => taegeukBall(parts, collidersOf(container)[0]) },
]

const UNCOLLIDED_BUILDERS = [
    { pattern: /^sword$/, build: obangFlag },
    { pattern: /^Cube006$/, build: badukBoard },
    { pattern: /^Cylinder$/, build: watermelonTray },
    { pattern: /^Plane005$/, build: dotjari },
    { pattern: /^refPillar$/, build: stonePillar },
    { pattern: /^refFan$/, build: (parts) => pinwheel(parts) },
]

const CIRCUIT_OBJECT = /^refObjectsPhysicalDynamic/

function rebuildChild(child, materials, { build, keepEmissive = true })
{
    const container = prepare(child, { keepEmissive })
    const parts = createParts()
    build(parts, container, materials)
    container.add(parts.build(materials))
}

export function rebuildVillageProps(model, materials)
{
    for(const child of [...model.children])
    {
        const uncollided = UNCOLLIDED_BUILDERS.find((item) => item.pattern.test(child.name))
        if(uncollided && child.isMesh)
        {
            const frame = boundsFrame(child)
            const container = prepare(child)
            const parts = createParts()
            uncollided.build(parts, frame)
            container.add(parts.build(materials))
            continue
        }
        const builder = BUILDERS.find((item) => item.pattern.test(child.name))
        if(builder)
            rebuildChild(child, materials, builder)
    }
}

const CIRCUIT_OBSTACLE = /^refObstaclesPhysicalKinematicPositionBased/
const BATDAM = { rows: 3, stoneLength: 0.62, seed: 17 }

function batdam(parts, container)
{
    const random = seededRandom(BATDAM.seed)
    for(const { size, matrix } of collidersOf(container))
    {
        const rowHeight = size.y / BATDAM.rows
        const count = Math.max(2, Math.round(size.z / BATDAM.stoneLength))
        const length = size.z / count
        for(let row = 0; row < BATDAM.rows; row++)
        {
            const y = -size.y / 2 + rowHeight * (row + 0.5)
            for(let index = 0; index < count; index++)
            {
                const z = -size.z / 2 + length * (index + 0.5) + (row % 2) * length * 0.25
                const name = random() > 0.5 ? 'basalt' : 'basaltDark'
                parts.box(name, [size.x * (0.8 + random() * 0.2), rowHeight * (0.85 + random() * 0.2), length * 0.92], { position: [0, y, Math.min(z, size.z / 2 - length * 0.45)], rotation: [random() * 0.2 - 0.1, random() * 0.3 - 0.15, random() * 0.2 - 0.1], matrix })
            }
        }
    }
}

function circuitFiller(parts, container)
{
    const [frame] = collidersOf(container)
    if(frame.isTube && frame.radius > 0.5)
        bigDok(parts, frame)
    else
        strawBale(parts, frame)
}

export function rebuildCircuitObjects(model, materials)
{
    for(const child of [...model.children])
    {
        if(CIRCUIT_OBJECT.test(child.name))
            rebuildChild(child, materials, { build: circuitFiller })
        else if(CIRCUIT_OBSTACLE.test(child.name))
            rebuildChild(child, materials, { build: batdam })
    }
}

const PODIUM_BACKDROP = { front: -1.53, back: -1.58, bottom: -1.0, top: 3.53, halfDepth: 3.87, frame: 0.12 }
const PODIUM_RANK_MARK = { width: 0.5, height: 0.08, gap: 0.16 }

function podiumStep(parts, frame, rank)
{
    const { size, matrix } = frame
    const top = size.y / 2
    parts.box('stone', [size.x, size.y, size.z], { matrix })
    parts.box('stoneDark', [size.x + 0.06, 0.1, size.z + 0.06], { position: [0, top - 0.05, 0], matrix })
    const front = size.x / 2 + 0.01
    for(let index = 0; index < rank; index++)
    {
        const y = top - 0.3 - index * PODIUM_RANK_MARK.gap
        parts.box('obangYellow', [0.02, PODIUM_RANK_MARK.height, PODIUM_RANK_MARK.width], { position: [front, y, 0], matrix })
    }
}

function podiumBackdrop(parts)
{
    const { front, back, bottom, top, halfDepth, frame } = PODIUM_BACKDROP
    const thickness = front - back
    parts.box('woodDark', [thickness, top - bottom, halfDepth * 2], { position: [(front + back) / 2, (top + bottom) / 2, 0] })
    for(const side of [-1, 1])
        parts.box('pillarRed', [0.24, top - bottom + 0.2, frame * 2], { position: [front - 0.08, (top + bottom) / 2 + 0.1, side * (halfDepth - frame)] })
    parts.box('giwa', [0.9, 0.14, halfDepth * 2 + 0.6], { position: [front - 0.1, top + 0.27, 0] })
    parts.box('giwaRidge', [0.24, 0.14, halfDepth * 2 + 0.7], { position: [front - 0.1, top + 0.4, 0] })
}

export function rebuildPodium(model, materials)
{
    const podium = model.children.find((child) => /^refPodiumPhysicalFixed/.test(child.name))
    if(!podium)
        return
    podium.children.filter((child) => child.isMesh && child.material?.name === 'palette').forEach((child) => child.removeFromParent())
    const steps = collidersOf(podium).filter((frame) => frame.size.x > 1).sort((a, b) => b.size.y - a.size.y)
    const parts = createParts()
    steps.forEach((frame, index) => podiumStep(parts, frame, index + 1))
    podiumBackdrop(parts)
    podium.add(parts.build(materials))
}

const box3 = (min, max) => new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max))

const CIRCUIT_DECORATION = {
    resetLetters: box3([-17.33, -0.03, 2.38], [-17.15, 0.47, 4.47]),
    tires: [box3([-27.45, -1.05, -3.25], [-23.98, 0.5, 0.1]), box3([-2.35, -1.05, 10.9], [0.85, 0.5, 14.55])],
    clock: box3([-17.8, -1.05, 4.68], [-16.6, 0.6, 6.2]),
    gantry: box3([-14.6, -1.1, -18.3], [-0.1, 4, -14.6]),
    startLights: box3([-11.6, 2.2, -16.9], [-7.8, 3.6, -15.4]),
    tents: box3([-29, -1.1, -27], [-15, 2, -2]),
    dancerBases: [[-26.08, -16.23], [0, 0]],
    bannerStands: [[-17.62, -15.69], [-17.48, -4.1]],
    propReach: 0.8,
    groundPaintTop: -0.9,
    legMaxWidth: 0.25,
    legMinHeight: 1.5,
}

function classifyDecoration(component)
{
    const { box } = component
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const {
        resetLetters, tires, clock, gantry, startLights, tents, dancerBases, bannerStands, propReach, groundPaintTop, legMaxWidth, legMinHeight,
    } = CIRCUIT_DECORATION
    const isProp = [...dancerBases, ...bannerStands].some(([x, z]) => Math.hypot(center.x - x, center.z - z) < propReach)
    const isErased = isProp || [resetLetters, clock, ...tires].some((region) => region.containsPoint(center))
        || (gantry.containsPoint(center) && !startLights.containsBox(box) && box.max.y > groundPaintTop)
    if(isErased)
        return 'erase'
    if(tents.containsPoint(center) && size.x < legMaxWidth && size.z < legMaxWidth && size.y > legMinHeight)
        return 'tentLeg'
    return 'keep'
}

const BYEOTGARI = { radius: 0.68, bottom: -1.01, height: 1.46, columns: [[-24.75, -0.65], [-26.68, -2.5], [-25.57, -1.66], [0.1, 13.81], [-1.57, 11.63], [-0.72, 12.81]] }

function byeotgari(parts)
{
    const { radius, bottom, height, columns } = BYEOTGARI
    for(const [x, z] of columns)
    {
        parts.prism('thatch', radius * 0.92, radius, height, { position: [x, bottom + height / 2, z] }, 10)
        for(const t of [0.3, 0.7])
            parts.prism('thatchRope', radius * 1.01, radius * 1.01, 0.08, { position: [x, bottom + height * t, z] }, 10)
        parts.prism('thatch', 0, radius * 0.95, 0.45, { position: [x, bottom + height + 0.22, z] }, 10)
    }
}

function angbuilgu(parts)
{
    const center = CIRCUIT_DECORATION.clock.getCenter(new THREE.Vector3())
    const bottom = CIRCUIT_DECORATION.clock.min.y
    parts.box('stone', [0.9, 0.55, 0.9], { position: [center.x, bottom + 0.275, center.z] })
    parts.box('stoneDark', [1.0, 0.08, 1.0], { position: [center.x, bottom + 0.59, center.z] })
    for(const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
        parts.box('bronze', [0.08, 0.3, 0.08], { position: [center.x + x * 0.28, bottom + 0.78, center.z + z * 0.28] })
    lathe(parts, 'bronze', [[0, bottom + 0.75], [0.36, bottom + 0.82], [0.52, bottom + 1.05], [0.56, bottom + 1.22], [0.5, bottom + 1.22], [0.46, bottom + 1.08], [0.3, bottom + 0.9], [0, bottom + 0.86]], { position: [center.x, 0, center.z] }, 12)
    parts.rod('iron', 0.02, [center.x - 0.42, bottom + 1.2, center.z], [center.x, bottom + 0.9, center.z])
}

const HONGSALMUN = { postX: [-14.2, -0.5], z: -16.32, bottom: -1, lowerBeam: 3.72, upperBeam: 4.2, slatTop: 4.95, slatGap: 0.55 }

function hongsalmun(parts)
{
    const { postX, z, bottom, lowerBeam, upperBeam, slatTop, slatGap } = HONGSALMUN
    const [left, right] = postX
    const width = right - left
    for(const x of postX)
    {
        parts.prism('stoneDark', 0.32, 0.36, 0.3, { position: [x, bottom + 0.15, z] }, 8)
        parts.prism('pillarRed', 0.18, 0.2, slatTop - bottom, { position: [x, (slatTop + bottom) / 2, z] }, 8)
    }
    for(const y of [lowerBeam, upperBeam])
        parts.box('pillarRed', [width + 0.5, 0.18, 0.18], { position: [(left + right) / 2, y, z] })
    for(let x = left + slatGap; x < right - slatGap / 2; x += slatGap)
    {
        parts.box('pillarRed', [0.06, slatTop - lowerBeam, 0.06], { position: [x, (slatTop + lowerBeam) / 2, z] })
        parts.prism('pillarRed', 0, 0.06, 0.18, { position: [x, slatTop + 0.09, z] }, 4)
    }
    const centerX = (left + right) / 2
    parts.add('obangRed', new THREE.CylinderGeometry(0.42, 0.42, 0.08, 14, 1, false, Math.PI, Math.PI), { position: [centerX, (lowerBeam + upperBeam) / 2 + 0.1, z + 0.12], rotation: [Math.PI / 2, 0, 0] })
    parts.add('obangBlue', new THREE.CylinderGeometry(0.42, 0.42, 0.08, 14, 1, false, 0, Math.PI), { position: [centerX, (lowerBeam + upperBeam) / 2 + 0.1, z + 0.12], rotation: [Math.PI / 2, 0, 0] })
}

function dancerChest(parts)
{
    for(const [x, z] of CIRCUIT_DECORATION.dancerBases)
    {
        parts.box('basalt', [1.2, 0.9, 1.2], { position: [x, -0.5, z] })
        parts.box('stone', [1.3, 0.12, 1.3], { position: [x, -0.02, z] })
        parts.box('basaltDark', [1.32, 0.12, 1.32], { position: [x, -0.9, z] })
    }
}

function bannerStand(parts)
{
    for(const [x, z] of CIRCUIT_DECORATION.bannerStands)
    {
        parts.box('stoneDark', [1.2, 0.2, 1.2], { position: [x, -0.9, z] })
        parts.box('stone', [0.5, 0.16, 0.5], { position: [x, -0.72, z] })
        parts.prism('wood', 0.07, 0.08, 1.35, { position: [x, -0.14, z] }, 6)
    }
}

function tentPole(parts, box)
{
    const center = box.getCenter(new THREE.Vector3())
    const height = box.max.y - box.min.y
    parts.prism('wood', 0.07, 0.09, height, { position: center.toArray() }, 6)
}

export function reshapeCircuitDecoration(model, materials)
{
    const decoration = model.getObjectByName('Cube088')
    if(!decoration?.isMesh)
        return
    const { index, components } = meshComponents(decoration.geometry)
    const parts = createParts()
    const removed = new Set()
    for(const component of components)
    {
        const kind = classifyDecoration(component)
        if(kind === 'keep')
            continue
        component.offsets.forEach((offset) => removed.add(offset))
        if(kind === 'tentLeg')
            tentPole(parts, component.box)
    }
    byeotgari(parts)
    angbuilgu(parts)
    dancerChest(parts)
    bannerStand(parts)
    hongsalmun(parts)
    const kept = []
    for(let offset = 0; offset < index.length; offset += 3)
        if(!removed.has(offset))
            kept.push(index[offset], index[offset + 1], index[offset + 2])
    decoration.geometry.setIndex(kept)
    decoration.add(parts.build(materials))
}

export function makeBungeoppang(cookie)
{
    cookie.geometry = bungeoppangGeometry()
    const material = new MeshDefaultMaterial({ colorNode: color(SHADES.bungeoppang), hasCoreShadows: true, hasDropShadows: true })
    material.userData.prevent = true
    cookie.material = material
}
