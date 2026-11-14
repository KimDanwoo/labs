import * as THREE from 'three/webgpu'
import { createParts, FULL_TURN, meshComponents, seededRandom } from './islandGeometry.js'
import { placeLandmarks } from './islandLandmarks.js'
import { islandModelMesh } from './islandModels.js'

const COLLIDER = /^(cuboid|hull|trimesh|tube|ball)/i
const REFERENCE = /^ref/i

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

const GAMEPAD_SIZE = new THREE.Vector3(1.62, 0.54, 1.28)

function placeGamepad(container, materials)
{
    const { size, matrix } = collidersOf(container)[0]
    const resting = matrix.clone().multiply(new THREE.Matrix4().makeTranslation(0, (GAMEPAD_SIZE.y - size.y) / 2, 0))
    container.add(islandModelMesh(materials, 'gamepad', resting, GAMEPAD_SIZE))
}

const SURF_FLAG = { width: 1.2, height: 3.2, depth: 0.4, poleX: -0.5 }

function surfFlag(parts, { size, matrix }, { container, materials })
{
    const scale = size.y / SURF_FLAG.height
    const anchored = matrix.clone().multiply(new THREE.Matrix4().makeTranslation(-SURF_FLAG.poleX * scale, 0, 0))
    const flagSize = new THREE.Vector3(SURF_FLAG.width * scale, size.y, SURF_FLAG.depth * scale)
    container.add(islandModelMesh(materials, 'surfFlag', anchored, flagSize))
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

const WORK_TABLE_DESIGN = {
    topThickness: 0.12,
    topHeightRatio: 0.15,
    apronThickness: 0.14,
    apronHeightRatio: 0.18,
    apronWidthRatio: 0.9,
    apronDepthRatio: 0.92,
    legWidth: 0.12,
    legWidthRatio: 0.16,
    legInset: 0.1,
    legInsetRatio: 0.2,
    sides: [-1, 1]
}

function workTable(parts, frame)
{
    const { size, matrix } = frame
    const design = WORK_TABLE_DESIGN
    const top = size.y / 2
    const topThickness = Math.min(design.topThickness, size.y * design.topHeightRatio)
    const apronThickness = Math.min(design.apronThickness, size.y * design.apronHeightRatio)
    const legWidth = Math.min(design.legWidth, size.x * design.legWidthRatio, size.z * design.legWidthRatio)
    const insetX = Math.max(legWidth / 2, Math.min(design.legInset, size.x * design.legInsetRatio))
    const insetZ = Math.max(legWidth / 2, Math.min(design.legInset, size.z * design.legInsetRatio))

    parts.box('wood', [size.x, topThickness, size.z], {
        position: [0, top - topThickness / 2, 0],
        matrix
    })
    parts.box('woodDark', [size.x * design.apronWidthRatio, apronThickness, size.z * design.apronDepthRatio], {
        position: [0, top - topThickness - apronThickness / 2, 0],
        matrix
    })
    for(const x of design.sides)
        for(const z of design.sides)
            parts.box('woodDark', [legWidth, size.y - topThickness, legWidth], {
                position: [x * (size.x / 2 - insetX), -topThickness / 2, z * (size.z / 2 - insetZ)],
                matrix
            })

    return new THREE.Vector3().setFromMatrixPosition(matrix).y + top
}

const CANDLE_STICKS_DESIGN = {
    minimumHeight: 0.05,
    topRadius: 0.032,
    bottomRadius: 0.038,
    shellRadius: 0.045,
    shellHeight: 0.02,
    shellHeightRatio: 0.18,
    shellProfile: [[0, 0], [0.65, 0], [1, 0.45], [0.9, 1], [0.7, 0.8], [0, 0.35]],
    segments: 8
}

function candleSticks(parts, container, tableTop)
{
    const design = CANDLE_STICKS_DESIGN

    for(const { center, bottom } of referenceCenter(container, /^refCandleFlame/))
    {
        const height = Math.max(design.minimumHeight, bottom - tableTop)
        const shellHeight = Math.min(design.shellHeight, height * design.shellHeightRatio)

        parts.prism('bamboo', design.topRadius, design.bottomRadius, height, {
            position: [center.x, tableTop + height / 2, center.z]
        }, design.segments)
        lathe(parts, 'sand', design.shellProfile.map(([r, y]) => [
            r * design.shellRadius,
            tableTop + y * shellHeight
        ]), {
            position: [center.x, 0, center.z]
        }, design.segments)
    }
}

const WATER_JAR_DESIGN = {
    profile: [
        [0, 0], [0.76, 0], [0.92, 0.12], [0.96, 0.28],
        [0.96, 0.78], [0.87, 1], [0.77, 1], [0.83, 0.84], [0, 0.84]
    ],
    waterRadiusRatio: 0.82,
    waterHeightRatio: 0.88,
    waterThicknessRatio: 0.02,
    hoopRadiusRatio: 0.98,
    hoopThicknessRatio: 0.065,
    hoopLevels: [0.25, 0.72],
    segments: 12
}

function waterJar(parts, frame)
{
    const { size, matrix } = frame
    const design = WATER_JAR_DESIGN
    const bottom = -size.y / 2
    const h = size.y
    const r = Math.min(size.x, size.z) / 2

    lathe(parts, 'wood', design.profile.map(([radius, y]) => [
        r * radius,
        bottom + h * y
    ]), { matrix }, design.segments)

    parts.prism('lagoon', r * design.waterRadiusRatio, r * design.waterRadiusRatio, h * design.waterThicknessRatio, {
        position: [0, bottom + h * design.waterHeightRatio, 0],
        matrix
    }, design.segments)

    for(const level of design.hoopLevels)
        parts.prism('woodDark', r * design.hoopRadiusRatio, r * design.hoopRadiusRatio, h * design.hoopThicknessRatio, {
            position: [0, bottom + h * level, 0],
            matrix
        }, design.segments)
}

const ANVIL_DESIGN = {
    stumpRadiusRatio: 0.4,
    stumpTopRatio: 0.84,
    stumpHeightRatio: 0.56,
    headWidthRatio: 0.5,
    headHeightRatio: 0.3,
    headDepthRatio: 0.62,
    headLevel: 0.71,
    hornTipWidthRatio: 0.025,
    hornTipHeightRatio: 0.04,
    hornBaseWidthRatio: 0.16,
    hornBaseHeightRatio: 0.13,
    hornLengthRatio: 0.32,
    hornLevel: 0.74,
    hornDepthRatio: 0.31,
    hornRotation: Math.PI / 2,
    stumpSegments: 10,
    hornSegments: 8
}

function anvil(parts, frame)
{
    const { size, matrix } = frame
    const design = ANVIL_DESIGN
    const bottom = -size.y / 2
    const stumpHeight = size.y * design.stumpHeightRatio
    const stumpRadius = Math.min(size.x, size.z) * design.stumpRadiusRatio

    parts.prism('timber', stumpRadius * design.stumpTopRatio, stumpRadius, stumpHeight, {
        position: [0, bottom + stumpHeight / 2, 0],
        matrix
    }, design.stumpSegments)
    parts.box('iron', [size.x * design.headWidthRatio, size.y * design.headHeightRatio, size.z * design.headDepthRatio], {
        position: [0, bottom + size.y * design.headLevel, 0],
        matrix
    })
    parts.prism(
        'iron',
        Math.min(size.x * design.hornTipWidthRatio, size.y * design.hornTipHeightRatio),
        Math.min(size.x * design.hornBaseWidthRatio, size.y * design.hornBaseHeightRatio),
        size.z * design.hornLengthRatio,
        {
            position: [0, bottom + size.y * design.hornLevel, size.z * design.hornDepthRatio],
            rotation: [design.hornRotation, 0, 0],
            matrix
        },
        design.hornSegments
    )
}

const CHARCOAL_FOOTPRINT = { x: 1.62, z: 1.52 }

const HWARO_DESIGN = {
    top: 0.38,
    foundationHeightRatio: 0.3,
    sideThickness: 0.16,
    endThickness: 0.14,
    capThickness: 0.06,
    capDepth: 0.18,
    charcoalHeightRatio: 0.06,
    charcoalLevel: 0.32,
    emberWidthRatio: 0.64,
    emberDepthRatio: 0.64,
    emberHeightRatio: 0.02,
    emberLevel: 0.36,
    grillThickness: 0.035,
    grillDepth: 0.045,
    grillOffsets: [-0.32, -0.16, 0, 0.16, 0.32],
    sides: [-1, 1]
}

function hwaro(parts, frame)
{
    const { matrix } = frame
    const design = HWARO_DESIGN
    const size = {
        x: Math.max(frame.size.x, CHARCOAL_FOOTPRINT.x),
        y: frame.size.y,
        z: Math.max(frame.size.z, CHARCOAL_FOOTPRINT.z)
    }
    const bottom = -size.y / 2
    const top = design.top
    const height = top - bottom
    const innerWidth = size.x - design.sideThickness * 2
    const innerDepth = size.z - design.endThickness * 2
    const capThickness = Math.min(design.capThickness, height)
    const grillThickness = Math.min(design.grillThickness, height)

    parts.box('stoneDark', [size.x, height * design.foundationHeightRatio, size.z], {
        position: [0, bottom + height * design.foundationHeightRatio / 2, 0],
        matrix
    })

    for(const side of design.sides)
    {
        parts.box('stone', [design.sideThickness, height, size.z], {
            position: [side * (size.x - design.sideThickness) / 2, bottom + height / 2, 0],
            matrix
        })
        parts.box('stone', [size.x, height, design.endThickness], {
            position: [0, bottom + height / 2, side * (size.z - design.endThickness) / 2],
            matrix
        })
        parts.box('sand', [size.x, capThickness, design.capDepth], {
            position: [0, top - capThickness / 2, side * (size.z - design.capDepth) / 2],
            matrix
        })
    }

    parts.box('basaltDark', [innerWidth, height * design.charcoalHeightRatio, innerDepth], {
        position: [0, bottom + height * design.charcoalLevel, 0],
        matrix
    })
    parts.box('bunting2', [innerWidth * design.emberWidthRatio, height * design.emberHeightRatio, innerDepth * design.emberDepthRatio], {
        position: [0, bottom + height * design.emberLevel, 0],
        matrix
    })

    for(const offset of design.grillOffsets)
        parts.box('iron', [innerWidth, grillThickness, design.grillDepth], {
            position: [0, top - grillThickness / 2, innerDepth * offset],
            matrix
        })
}

const GAMASOT_DESIGN = {
    profile: [
        [0, -0.55], [0.34, -0.55], [0.62, -0.4],
        [0.86, -0.13], [0.92, 0.19], [0.87, 0.34],
        [0.79, 0.34], [0.77, 0.17], [0.62, -0.12], [0, -0.24]
    ],
    rimProfile: [
        [0.79, 0.31], [0.87, 0.31], [0.89, 0.35],
        [0.86, 0.38], [0.78, 0.38], [0.79, 0.31]
    ],
    waterRadius: 0.78,
    waterThickness: 0.035,
    waterLevel: 0.205,
    handleSize: [0.16, 0.09, 0.22],
    handleOffset: 0.89,
    handleLevel: 0.15,
    sides: [-1, 1],
    segments: 14
}

function gamasot(parts)
{
    const design = GAMASOT_DESIGN

    lathe(parts, 'sand', design.profile, {}, design.segments)
    lathe(parts, 'bunting3', design.rimProfile, {}, design.segments)
    parts.prism('lagoon', design.waterRadius, design.waterRadius, design.waterThickness, {
        position: [0, design.waterLevel, 0]
    }, design.segments)

    for(const side of design.sides)
        parts.box('bunting4', design.handleSize, {
            position: [side * design.handleOffset, design.handleLevel, 0]
        })
}

const BENCH_DESIGN = {
    seatThickness: 0.14,
    seatThicknessRatio: 0.24,
    legWidth: 0.14,
    legWidthRatio: 0.16,
    legOffsetRatio: 0.4,
    backWidthRatio: 0.45,
    backSlatHeightRatio: 0.16,
    backLevels: [-0.3, 0, 0.3],
    postWidthRatio: 0.5,
    postDepth: 0.12,
    postDepthRatio: 0.16,
    sides: [-1, 1]
}

function bench(parts, container)
{
    const design = BENCH_DESIGN
    const colliders = collidersOf(container).sort((a, b) => b.size.x * b.size.z - a.size.x * a.size.z)
    const [seat, back] = colliders
    const top = seat.size.y / 2
    const seatThickness = Math.min(design.seatThickness, seat.size.y * design.seatThicknessRatio)
    const legWidth = Math.min(design.legWidth, seat.size.x * design.legWidthRatio, seat.size.z * design.legWidthRatio)

    parts.box('wood', [seat.size.x, seatThickness, seat.size.z], {
        position: [0, top - seatThickness / 2, 0],
        matrix: seat.matrix
    })

    for(const x of design.sides)
        for(const z of design.sides)
            parts.box('woodDark', [legWidth, seat.size.y - seatThickness, legWidth], {
                position: [x * seat.size.x * design.legOffsetRatio, -seatThickness / 2, z * seat.size.z * design.legOffsetRatio],
                matrix: seat.matrix
            })

    if(!back)
        return

    for(const level of design.backLevels)
        parts.box('wood', [back.size.x * design.backWidthRatio, back.size.y * design.backSlatHeightRatio, back.size.z], {
            position: [0, back.size.y * level, 0],
            matrix: back.matrix
        })

    const postDepth = Math.min(design.postDepth, back.size.z * design.postDepthRatio)

    for(const z of design.sides)
        parts.box('woodDark', [back.size.x * design.postWidthRatio, back.size.y, postDepth], {
            position: [0, 0, z * (back.size.z - postDepth) / 2],
            matrix: back.matrix
        })
}

const LOG_STOOL_DESIGN = {
    radiusRatio: 0.45,
    baseRadiusRatio: 1.06,
    seatRadiusRatio: 0.92,
    seatThickness: 0.02,
    seatThicknessRatio: 0.08,
    segments: 10
}

function logStool(parts, frame)
{
    const { size, matrix } = frame
    const design = LOG_STOOL_DESIGN
    const radius = Math.min(size.x, size.z) * design.radiusRatio
    const seatThickness = Math.min(design.seatThickness, size.y * design.seatThicknessRatio)

    parts.prism('timber', radius, radius * design.baseRadiusRatio, size.y - seatThickness, {
        position: [0, -seatThickness / 2, 0],
        matrix
    }, design.segments)
    parts.prism('sand', radius * design.seatRadiusRatio, radius * design.seatRadiusRatio, seatThickness, {
        position: [0, size.y / 2 - seatThickness / 2, 0],
        matrix
    }, design.segments)
}

const SOBAN_DESIGN = {
    topRadiusRatio: 0.96,
    undersideRadiusRatio: 0.91,
    topHeightRatio: 0.8,
    rimHeightRatio: 0.2,
    legRadius: 0.06,
    legRadiusRatio: 0.08,
    legOffsetRatio: 0.4,
    legCount: 4,
    legAngleOffset: Math.PI / 4,
    fullTurn: Math.PI * 2,
    braceWidthRatio: 0.8,
    braceDepthRatio: 0.8,
    braceThickness: 0.08,
    braceThicknessRatio: 0.12,
    topSegments: 12,
    legSegments: 8
}

function soban(parts, container)
{
    const design = SOBAN_DESIGN
    const colliders = collidersOf(container).sort((a, b) => a.size.y - b.size.y)
    const [top, base] = colliders
    const radius = Math.min(top.size.x, top.size.z) / 2
    const topHeight = top.size.y * design.topHeightRatio
    const rimHeight = top.size.y * design.rimHeightRatio

    parts.prism('bamboo', radius * design.topRadiusRatio, radius * design.undersideRadiusRatio, topHeight, {
        position: [0, -top.size.y / 2 + topHeight / 2, 0],
        matrix: top.matrix
    }, design.topSegments)
    parts.prism('palmLeaf', radius, radius, rimHeight, {
        position: [0, top.size.y / 2 - rimHeight / 2, 0],
        matrix: top.matrix
    }, design.topSegments)

    if(!base)
        return

    const legRadius = Math.min(design.legRadius, base.size.x * design.legRadiusRatio, base.size.z * design.legRadiusRatio)

    for(let index = 0; index < design.legCount; index++)
    {
        const angle = index / design.legCount * design.fullTurn + design.legAngleOffset
        parts.prism('bamboo', legRadius, legRadius, base.size.y, {
            position: [
                Math.cos(angle) * base.size.x * design.legOffsetRatio,
                0,
                Math.sin(angle) * base.size.z * design.legOffsetRatio
            ],
            matrix: base.matrix
        }, design.legSegments)
    }

    const braceThickness = Math.min(design.braceThickness, base.size.y * design.braceThicknessRatio)

    parts.box('woodDark', [base.size.x * design.braceWidthRatio, braceThickness, base.size.z * design.braceDepthRatio], {
        position: [0, -base.size.y / 2 + braceThickness / 2, 0],
        matrix: base.matrix
    })
}

const GOCHUJANG_JAR_DESIGN = {
    profile: [
        [0, 0], [0.7, 0], [0.86, 0.12], [0.86, 0.6],
        [0.7, 0.7], [0.32, 0.79], [0.32, 0.9], [0, 0.9]
    ],
    labelRadiusRatio: 0.88,
    labelHeightRatio: 0.2,
    labelLevel: 0.36,
    capRadiusRatio: 0.36,
    capHeightRatio: 0.12,
    capLevel: 0.94,
    segments: 10
}

function gochujangJar(parts, frame)
{
    const { radius, height, matrix } = frame
    const design = GOCHUJANG_JAR_DESIGN
    const bottom = -height / 2

    lathe(parts, 'bunting2', design.profile.map(([r, y]) => [
        radius * r,
        bottom + height * y
    ]), { matrix }, design.segments)
    parts.prism('mango', radius * design.labelRadiusRatio, radius * design.labelRadiusRatio, height * design.labelHeightRatio, {
        position: [0, bottom + height * design.labelLevel, 0],
        matrix
    }, design.segments)
    parts.prism('palmLeaf', radius * design.capRadiusRatio, radius * design.capRadiusRatio, height * design.capHeightRatio, {
        position: [0, bottom + height * design.capLevel, 0],
        matrix
    }, design.segments)
}

const OIL_BOTTLE_DESIGN = {
    bodyTopRadiusRatio: 0.94,
    bodyBottomRadiusRatio: 0.96,
    bodyHeightRatio: 0.62,
    bodyLevel: 0.31,
    neckRadiusRatio: 0.3,
    shoulderHeightRatio: 0.18,
    shoulderLevel: 0.71,
    capRadiusRatio: 0.32,
    capHeightRatio: 0.16,
    capLevel: 0.88,
    labelRadiusRatio: 0.98,
    labelHeightRatio: 0.22,
    labelLevel: 0.32,
    segments: 10,
    capSegments: 8
}

function oilBottle(parts, frame)
{
    const { radius, height, matrix } = frame
    const design = OIL_BOTTLE_DESIGN
    const bottom = -height / 2

    parts.prism('sand', radius * design.bodyTopRadiusRatio, radius * design.bodyBottomRadiusRatio, height * design.bodyHeightRatio, {
        position: [0, bottom + height * design.bodyLevel, 0],
        matrix
    }, design.segments)
    parts.prism('sand', radius * design.neckRadiusRatio, radius * design.bodyTopRadiusRatio, height * design.shoulderHeightRatio, {
        position: [0, bottom + height * design.shoulderLevel, 0],
        matrix
    }, design.segments)
    parts.prism('coconutShell', radius * design.capRadiusRatio, radius * design.capRadiusRatio, height * design.capHeightRatio, {
        position: [0, bottom + height * design.capLevel, 0],
        matrix
    }, design.capSegments)
    parts.prism('palmLeaf', radius * design.labelRadiusRatio, radius * design.labelRadiusRatio, height * design.labelHeightRatio, {
        position: [0, bottom + height * design.labelLevel, 0],
        matrix
    }, design.segments)
}

const BAR_COUNTER_DESIGN = {
    capThickness: 0.08,
    capThicknessRatio: 0.12,
    tubeBodyRadiusRatio: 0.95,
    tubeBandRadiusRatio: 0.98,
    tubeBandHeightRatio: 0.06,
    tubeBandLevel: -0.18,
    bodyWidthRatio: 0.96,
    bodyDepthRatio: 0.96,
    slatCount: 4,
    slatWidthRatio: 0.025,
    slatHeightRatio: 0.75,
    slatDepthRatio: 0.04,
    slatFrontRatio: 0.48,
    accentWidthRatio: 0.6,
    accentHeightRatio: 0.12,
    accentDepthRatio: 0.02,
    accentLevel: 0.26,
    accentFrontRatio: 0.49,
    segments: 14
}

function barCounter(parts, container)
{
    const design = BAR_COUNTER_DESIGN

    for(const frame of collidersOf(container))
    {
        const { size, matrix } = frame

        if(frame.isTube)
        {
            const capThickness = Math.min(design.capThickness, frame.height * design.capThicknessRatio)

            parts.prism('bamboo', frame.radius * design.tubeBodyRadiusRatio, frame.radius * design.tubeBodyRadiusRatio, frame.height - capThickness, {
                position: [0, -capThickness / 2, 0],
                matrix
            }, design.segments)
            parts.prism('woodDark', frame.radius, frame.radius, capThickness, {
                position: [0, frame.height / 2 - capThickness / 2, 0],
                matrix
            }, design.segments)
            parts.prism('bunting1', frame.radius * design.tubeBandRadiusRatio, frame.radius * design.tubeBandRadiusRatio, frame.height * design.tubeBandHeightRatio, {
                position: [0, frame.height * design.tubeBandLevel, 0],
                matrix
            }, design.segments)
            continue
        }

        const capThickness = Math.min(design.capThickness, size.y * design.capThicknessRatio)

        parts.box('cabinetWood', [size.x * design.bodyWidthRatio, size.y - capThickness, size.z * design.bodyDepthRatio], {
            position: [0, -capThickness / 2, 0],
            matrix
        })
        parts.box('woodDark', [size.x, capThickness, size.z], {
            position: [0, size.y / 2 - capThickness / 2, 0],
            matrix
        })

        for(let index = 1; index <= design.slatCount; index++)
            parts.box('bamboo', [size.x * design.slatWidthRatio, size.y * design.slatHeightRatio, size.z * design.slatDepthRatio], {
                position: [
                    -size.x / 2 + index * size.x / (design.slatCount + 1),
                    0,
                    size.z * design.slatFrontRatio
                ],
                matrix
            })

        parts.box('bunting1', [size.x * design.accentWidthRatio, size.y * design.accentHeightRatio, size.z * design.accentDepthRatio], {
            position: [0, size.y * design.accentLevel, size.z * design.accentFrontRatio],
            matrix
        })
    }
}

const MAKGEOLLI_BOWL_DESIGN = {
    profile: [
        [0, 0], [0.42, 0], [0.78, 0.14], [0.96, 0.44],
        [0.88, 0.72], [0.78, 0.72], [0.7, 0.28], [0, 0.24]
    ],
    drinkRadiusRatio: 0.79,
    drinkThicknessRatio: 0.025,
    drinkLevel: 0.64,
    strawRadiusRatio: 0.045,
    strawHeightRatio: 0.025,
    strawPoints: [[-0.2, 0.42, 0], [0.14, 0.91, 0], [0.42, 0.96, 0]],
    segments: 12,
    strawSegments: 6
}

function makgeolliBowl(parts, frame)
{
    const { radius, height, matrix } = frame
    const design = MAKGEOLLI_BOWL_DESIGN
    const bottom = -height / 2

    lathe(parts, 'coconutShell', design.profile.map(([r, y]) => [
        radius * r,
        bottom + height * y
    ]), { matrix }, design.segments)
    parts.prism('bunting4', radius * design.drinkRadiusRatio, radius * design.drinkRadiusRatio, height * design.drinkThicknessRatio, {
        position: [0, bottom + height * design.drinkLevel, 0],
        matrix
    }, design.segments)

    const strawRadius = Math.min(radius * design.strawRadiusRatio, height * design.strawHeightRatio)
    const points = design.strawPoints.map(([x, y, z]) => new THREE.Vector3(
        radius * x,
        bottom + height * y,
        radius * z
    ))
    const up = new THREE.Vector3(0, 1, 0)

    for(let index = 1; index < points.length; index++)
    {
        const from = points[index - 1]
        const to = points[index]
        const direction = new THREE.Vector3().subVectors(to, from)
        const length = direction.length()
        const midpoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5)
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.normalize())
        const rotation = new THREE.Euler().setFromQuaternion(quaternion)

        parts.prism('bunting1', strawRadius, strawRadius, length, {
            position: [midpoint.x, midpoint.y, midpoint.z],
            rotation: [rotation.x, rotation.y, rotation.z],
            matrix
        }, design.strawSegments)
    }
}

const STRAW_BALE_DESIGN = {
    bodyRadiusRatio: 0.97,
    bodyWidthRatio: 0.96,
    bodyDepthRatio: 0.96,
    ropeThickness: 0.06,
    ropeThicknessRatio: 0.12,
    ropeOffsets: [-0.3, 0.3],
    segments: 10
}

function strawBale(parts, frame)
{
    const { size, matrix } = frame
    const design = STRAW_BALE_DESIGN

    if(frame.isTube)
    {
        const ropeThickness = Math.min(design.ropeThickness, frame.height * design.ropeThicknessRatio)

        parts.prism('thatch', frame.radius * design.bodyRadiusRatio, frame.radius * design.bodyRadiusRatio, frame.height, {
            matrix
        }, design.segments)

        for(const y of design.ropeOffsets)
            parts.prism('thatchRope', frame.radius, frame.radius, ropeThickness, {
                position: [0, frame.height * y, 0],
                matrix
            }, design.segments)
        return
    }

    const ropeThickness = Math.min(design.ropeThickness, size.x * design.ropeThicknessRatio)

    parts.box('thatch', [size.x * design.bodyWidthRatio, size.y, size.z * design.bodyDepthRatio], { matrix })

    for(const x of design.ropeOffsets)
        parts.box('thatchRope', [ropeThickness, size.y, size.z], {
            position: [size.x * x, 0, 0],
            matrix
        })
}

const BIG_DOK_DESIGN = {
    profile: [
        [0, 0], [0.65, 0], [0.8, 0.1],
        [0.85, 0.18], [0.89, 0.22], [0.86, 0.25],
        [0.94, 0.32], [0.9, 0.35], [0.94, 0.42],
        [0.9, 0.45], [0.94, 0.52], [0.9, 0.55],
        [0.94, 0.62], [0.9, 0.65], [0.94, 0.72],
        [0.9, 0.8], [0.84, 0.92], [0, 0.92]
    ],
    lidTopRadiusRatio: 0.78,
    lidBottomRadiusRatio: 0.9,
    lidHeightRatio: 0.08,
    lidLevel: 0.96,
    bands: [
        { radiusRatio: 0.86, level: 0.18 },
        { radiusRatio: 0.95, level: 0.76 }
    ],
    bandHeightRatio: 0.06,
    segments: 12
}

function bigDok(parts, frame)
{
    const { radius, height, matrix } = frame
    const design = BIG_DOK_DESIGN
    const bottom = -height / 2

    lathe(parts, 'bamboo', design.profile.map(([r, y]) => [
        radius * r,
        bottom + height * y
    ]), { matrix }, design.segments)
    parts.prism('thatch', radius * design.lidTopRadiusRatio, radius * design.lidBottomRadiusRatio, height * design.lidHeightRatio, {
        position: [0, bottom + height * design.lidLevel, 0],
        matrix
    }, design.segments)

    for(const band of design.bands)
        parts.prism('palmLeaf', radius * band.radiusRatio, radius * band.radiusRatio, height * design.bandHeightRatio, {
            position: [0, bottom + height * band.level, 0],
            matrix
        }, design.segments)
}

const TV_BODY = { halfWidth: 0.97, bottom: -1.15, top: 0.84, back: -0.5, front: 0.33 }
const TV_SCREEN = { halfWidth: 0.71, bottom: -0.68, top: 0.55 }

const TV_ISLAND = {
    rearHeightLimit: 1.5,
    rearScale: [0.8, 0.9, 0.95],
    frameOffset: 0.04,
    barWidth: 0.1,
    barDepth: 0.08,
    grilleSize: [1.2, 0.24, 0.03],
    grillePosition: [-0.12, -0.93],
    grilleOffset: 0.015,
    slatSize: [1.16, 0.025, 0.035],
    slatRows: [-0.85, -0.93, -1.01],
    slatOffset: 0.02,
    knobRadius: 0.06,
    knobDepth: 0.06,
    knobPosition: [0.79, -0.8],
    knobOffset: 0.03,
    knobSides: 8,
    roofOverhang: 0.12,
    roofHeight: 0.06,
    ribHeight: 0.02,
    ribCount: 6,
    ribWidthRatio: 0.045,
    ribDepthRatio: 0.96,
    ribSpread: 0.84,
    frontRotation: Math.PI / 2,
}

function tvCabinet(parts, container)
{
    const { halfWidth, bottom, top, back, front } = TV_BODY
    const design = TV_ISLAND
    const depth = front - back
    const centerZ = (front + back) / 2

    parts.box('cabinetWood', [halfWidth * 2, top - bottom, depth], {
        position: [0, (top + bottom) / 2, centerZ],
    })

    const rear = collidersOf(container).find((frame) => frame.size.y < design.rearHeightLimit)

    if(rear)
        parts.box('coconutShell', [
            rear.size.x * design.rearScale[0],
            rear.size.y * design.rearScale[1],
            rear.size.z * design.rearScale[2],
        ], { matrix: rear.matrix })

    const frameZ = front + design.frameOffset
    const bar = design.barWidth
    const screenHeight = TV_SCREEN.top - TV_SCREEN.bottom

    for(const y of [TV_SCREEN.top + bar / 2, TV_SCREEN.bottom - bar / 2])
        parts.box('bamboo', [TV_SCREEN.halfWidth * 2 + bar * 2, bar, design.barDepth], {
            position: [0, y, frameZ],
        })

    for(const side of [-1, 1])
        parts.box('bamboo', [bar, screenHeight, design.barDepth], {
            position: [
                side * (TV_SCREEN.halfWidth + bar / 2),
                (TV_SCREEN.top + TV_SCREEN.bottom) / 2,
                frameZ,
            ],
        })

    parts.box('bunting1', design.grilleSize, {
        position: [
            design.grillePosition[0],
            design.grillePosition[1],
            front + design.grilleOffset,
        ],
    })

    for(const y of design.slatRows)
        parts.box('bamboo', design.slatSize, {
            position: [design.grillePosition[0], y, front + design.slatOffset],
        })

    parts.prism('bunting2', design.knobRadius, design.knobRadius, design.knobDepth, {
        position: [
            design.knobPosition[0],
            design.knobPosition[1],
            front + design.knobOffset,
        ],
        rotation: [design.frontRotation, 0, 0],
    }, design.knobSides)

    const roofWidth = halfWidth * 2 + design.roofOverhang
    const roofDepth = depth + design.roofOverhang

    parts.box('thatch', [roofWidth, design.roofHeight, roofDepth], {
        position: [0, top + design.roofHeight / 2, centerZ],
    })

    for(let index = 0; index < design.ribCount; index++)
    {
        const x = (index / (design.ribCount - 1) - 0.5) * roofWidth * design.ribSpread

        parts.box('bamboo', [
            roofWidth * design.ribWidthRatio,
            design.ribHeight,
            roofDepth * design.ribDepthRatio,
        ], {
            position: [x, top + design.roofHeight + design.ribHeight / 2, centerZ],
        })
    }
}

const DRIFTWOOD_BOARD = {
    legHeightRatio: 0.32,
    legWidthRatio: 0.12,
    legSpread: 0.36,
    slabWidthRatio: 0.96,
    slabTopRatio: 0.9,
    boardHalfRatio: 0.42,
    cells: 4,
    tileInsetRatio: 0.94,
    tileHeightRatio: 0.012,
    tokenHeightRatio: 0.06,
    tokenRadiusRatio: 0.28,
    tokenTopRatio: 0.72,
    tokenSides: 8,
    tiles: ['sand', 'bunting1'],
    tokens: [
        [0, 0, 'bunting4'],
        [2, 1, 'bunting2'],
        [3, 3, 'bunting4'],
        [1, 2, 'bunting2'],
        [0, 3, 'bunting4'],
    ],
}

function badukBoard(parts, frame)
{
    const { size, matrix } = frame
    const design = DRIFTWOOD_BOARD
    const bottom = -size.y / 2
    const top = bottom + size.y
    const legHeight = size.y * design.legHeightRatio
    const slabTop = bottom + size.y * design.slabTopRatio
    const slabHeight = slabTop - bottom - legHeight
    const tileHeight = size.y * design.tileHeightRatio
    const tokenHeight = Math.min(size.y * design.tokenHeightRatio, top - slabTop - tileHeight)
    const half = Math.min(size.x, size.z) * design.boardHalfRatio
    const step = half * 2 / design.cells
    const tileWidth = step * design.tileInsetRatio

    parts.box('timber', [
        size.x * design.slabWidthRatio,
        slabHeight,
        size.z * design.slabWidthRatio,
    ], {
        position: [0, bottom + legHeight + slabHeight / 2, 0],
        matrix,
    })

    for(const x of [-1, 1])
        for(const z of [-1, 1])
            parts.box('coconutShell', [
                size.x * design.legWidthRatio,
                legHeight,
                size.z * design.legWidthRatio,
            ], {
                position: [
                    x * size.x * design.legSpread,
                    bottom + legHeight / 2,
                    z * size.z * design.legSpread,
                ],
                matrix,
            })

    for(let row = 0; row < design.cells; row++)
        for(let column = 0; column < design.cells; column++)
            parts.box(design.tiles[(row + column) % design.tiles.length], [
                tileWidth,
                tileHeight,
                tileWidth,
            ], {
                position: [
                    -half + (column + 0.5) * step,
                    slabTop + tileHeight / 2,
                    -half + (row + 0.5) * step,
                ],
                matrix,
            })

    const tokenRadius = step * design.tokenRadiusRatio

    for(const [column, row, shade] of design.tokens)
        parts.prism(shade, tokenRadius * design.tokenTopRatio, tokenRadius, tokenHeight, {
            position: [
                -half + (column + 0.5) * step,
                slabTop + tileHeight + tokenHeight / 2,
                -half + (row + 0.5) * step,
            ],
            matrix,
        }, design.tokenSides)
}

const TROPICAL_PLATTER = {
    trayWidthRatio: 0.95,
    trayDepthRatio: 0.9,
    trayHeight: 0.05,
    trayHeightRatio: 0.16,
    rimWidthRatio: 0.025,
    rimHeightRatio: 0.08,
    rimDepthRatio: 0.86,
    rimSpread: 0.45,
    pineappleXRatio: -0.23,
    pineappleRadiusRatios: [0.16, 0.2, 0.45],
    pineappleHeightRatio: 0.63,
    pineappleTopRadiusRatio: 0.82,
    pineappleBottomRadiusRatio: 0.95,
    pineappleSides: 8,
    beltRadiusRatio: 0.98,
    beltHeightRatio: 0.08,
    beltCenterRatio: 0.48,
    crownHeightRatio: 0.28,
    crownRadiusLimit: 1.4,
    crownRadiusRatio: 0.4,
    crownSpreadRatio: 0.2,
    crownLiftRatio: 0.4,
    crownTilt: 0.35,
    crownSides: 4,
    mangoXRatio: 0.22,
    mangoZRatios: [-0.19, 0.19],
    mangoRadiusRatios: [0.18, 0.22],
    mangoHeightRatio: 0.26,
    mangoRoundness: 0.7,
    mangoSegments: [6, 4],
    mangoShades: ['mango', 'pineapple'],
}

function watermelonTray(parts, frame)
{
    const { size, matrix } = frame
    const design = TROPICAL_PLATTER
    const bottom = -size.y / 2
    const trayHeight = Math.min(design.trayHeight, size.y * design.trayHeightRatio)
    const trayTop = bottom + trayHeight
    const availableHeight = size.y - trayHeight
    const rimHeight = availableHeight * design.rimHeightRatio

    parts.box('bamboo', [
        size.x * design.trayWidthRatio,
        trayHeight,
        size.z * design.trayDepthRatio,
    ], {
        position: [0, bottom + trayHeight / 2, 0],
        matrix,
    })

    for(const side of [-1, 1])
        parts.box('coconutShell', [
            size.x * design.rimWidthRatio,
            rimHeight,
            size.z * design.rimDepthRatio,
        ], {
            position: [side * size.x * design.rimSpread, trayTop + rimHeight / 2, 0],
            matrix,
        })

    const radius = Math.min(
        size.x * design.pineappleRadiusRatios[0],
        size.z * design.pineappleRadiusRatios[1],
        availableHeight * design.pineappleRadiusRatios[2],
    )
    const pineappleX = size.x * design.pineappleXRatio
    const pineappleHeight = availableHeight * design.pineappleHeightRatio
    const pineappleTop = trayTop + pineappleHeight

    parts.prism(
        'pineapple',
        radius * design.pineappleTopRadiusRatio,
        radius * design.pineappleBottomRadiusRatio,
        pineappleHeight,
        {
            position: [pineappleX, trayTop + pineappleHeight / 2, 0],
            matrix,
        },
        design.pineappleSides,
    )

    parts.prism(
        'bunting3',
        radius * design.beltRadiusRatio,
        radius * design.beltRadiusRatio,
        pineappleHeight * design.beltHeightRatio,
        {
            position: [pineappleX, trayTop + pineappleHeight * design.beltCenterRatio, 0],
            matrix,
        },
        design.pineappleSides,
    )

    const crownHeight = Math.min(
        availableHeight * design.crownHeightRatio,
        radius * design.crownRadiusLimit,
    )

    for(const side of [-1, 1])
        parts.add('palmLeaf', new THREE.ConeGeometry(
            radius * design.crownRadiusRatio,
            crownHeight,
            design.crownSides,
        ), {
            position: [
                pineappleX + side * radius * design.crownSpreadRatio,
                pineappleTop + crownHeight * design.crownLiftRatio,
                0,
            ],
            rotation: [0, 0, side * design.crownTilt],
            matrix,
        })

    const mangoRadius = Math.min(
        size.x * design.mangoRadiusRatios[0],
        size.z * design.mangoRadiusRatios[1],
    )
    const mangoHeight = Math.min(
        availableHeight * design.mangoHeightRatio,
        mangoRadius * design.mangoRoundness,
    )

    design.mangoZRatios.forEach((zRatio, index) =>
        parts.add(design.mangoShades[index], new THREE.SphereGeometry(
            1,
            design.mangoSegments[0],
            design.mangoSegments[1],
        ), {
            position: [
                size.x * design.mangoXRatio,
                trayTop + mangoHeight,
                size.z * zRatio,
            ],
            scale: [mangoRadius, mangoHeight, mangoRadius * design.mangoRoundness],
            matrix,
        }))
}

const BEACH_TOWEL = {
    widthRatio: 0.96,
    depthRatio: 0.92,
    thickness: 0.04,
    thicknessRatio: 0.5,
    stripeCount: 5,
    stripeSpread: 0.6,
    stripeDepthRatio: 0.07,
    stripeHeightRatio: 0.15,
    stripeShades: ['bunting1', 'bunting2', 'bunting3', 'bunting2', 'bunting1'],
    fringeX: [-0.36, -0.12, 0.12, 0.36],
    fringeWidthRatio: 0.035,
    fringeDepthRatio: 0.05,
    fringeHeightRatio: 0.5,
    fringeZRatio: 0.475,
}

function dotjari(parts, frame)
{
    const { size, matrix } = frame
    const design = BEACH_TOWEL
    const bottom = -size.y / 2
    const thickness = Math.min(design.thickness, size.y * design.thicknessRatio)
    const stripeHeight = thickness * design.stripeHeightRatio

    parts.box('bunting4', [
        size.x * design.widthRatio,
        thickness,
        size.z * design.depthRatio,
    ], {
        position: [0, bottom + thickness / 2, 0],
        matrix,
    })

    for(let index = 0; index < design.stripeCount; index++)
    {
        const z = (index / (design.stripeCount - 1) - 0.5) * size.z * design.stripeSpread

        parts.box(design.stripeShades[index], [
            size.x * design.widthRatio,
            stripeHeight,
            size.z * design.stripeDepthRatio,
        ], {
            position: [0, bottom + thickness + stripeHeight / 2, z],
            matrix,
        })
    }

    const fringeHeight = thickness * design.fringeHeightRatio

    for(const side of [-1, 1])
        for(const xRatio of design.fringeX)
            parts.box('sand', [
                size.x * design.fringeWidthRatio,
                fringeHeight,
                size.z * design.fringeDepthRatio,
            ], {
                position: [
                    size.x * xRatio,
                    bottom + fringeHeight / 2,
                    side * size.z * design.fringeZRatio,
                ],
                matrix,
            })
}

const ISLAND_BELLOWS = {
    bodyWidthRatio: 0.92,
    bodyDepthRatio: 0.92,
    bodyHeight: 0.2,
    runnerWidth: 0.14,
    runnerWidthRatio: 0.16,
    runnerHeight: 0.08,
    runnerHeightRatio: 0.3,
    runnerDepthRatio: 0.96,
    runnerSpread: 0.36,
    bodyLiftRatio: 0.75,
}

function bellowsBase(parts, frame)
{
    const { size, matrix } = frame
    const design = ISLAND_BELLOWS
    const bottom = -size.y / 2
    const runnerHeight = Math.min(design.runnerHeight, size.y * design.runnerHeightRatio)
    const bodyLift = runnerHeight * design.bodyLiftRatio
    const bodyHeight = Math.min(design.bodyHeight, size.y - bodyLift)

    parts.box('coconutShell', [
        size.x * design.bodyWidthRatio,
        bodyHeight,
        size.z * design.bodyDepthRatio,
    ], {
        position: [0, bottom + bodyLift + bodyHeight / 2, 0],
        matrix,
    })

    for(const side of [-1, 1])
        parts.box('bamboo', [
            Math.min(design.runnerWidth, size.x * design.runnerWidthRatio),
            runnerHeight,
            size.z * design.runnerDepthRatio,
        ], {
            position: [side * size.x * design.runnerSpread, bottom + runnerHeight / 2, 0],
            matrix,
        })
}

const PIN_PROFILE = [
    [0, 0.02],
    [0.3, 0.02],
    [0.46, 0.55],
    [0.48, 0.85],
    [0.36, 1.45],
    [0.22, 1.85],
    [0.24, 2.2],
    [0.3, 2.5],
    [0.24, 2.8],
    [0, 2.92],
]

const ISLAND_PIN = {
    segments: 10,
    bands: [
        { shade: 'bunting2', topRadius: 0.24, bottomRadius: 0.245, height: 0.12, y: 1.95 },
        { shade: 'bunting1', topRadius: 0.242, bottomRadius: 0.24, height: 0.08, y: 2.08 },
    ],
}

function bowlingPin(parts)
{
    lathe(parts, 'bunting4', PIN_PROFILE, {}, ISLAND_PIN.segments)

    for(const band of ISLAND_PIN.bands)
        parts.prism(band.shade, band.topRadius, band.bottomRadius, band.height, {
            position: [0, band.y, 0],
        }, ISLAND_PIN.segments)
}

const BEACH_BALL_PANELS = ['bunting2', 'bunting4', 'bunting1', 'bunting4', 'bunting3', 'bunting4']

const BEACH_BALL = {
    fullTurn: Math.PI * 2,
    widthSegments: 3,
    heightSegments: 8,
}

function beachBall(parts, frame)
{
    const radius = frame.size.x / 2
    const panel = BEACH_BALL.fullTurn / BEACH_BALL_PANELS.length

    BEACH_BALL_PANELS.forEach((shade, index) =>
        parts.add(shade, new THREE.SphereGeometry(
            radius,
            BEACH_BALL.widthSegments,
            BEACH_BALL.heightSegments,
            index * panel,
            panel,
        )))
}

const CORAL_PILLAR = {
    baseHeight: 0.28,
    baseHeightRatio: 0.22,
    capitalHeight: 0.24,
    capitalHeightRatio: 0.18,
    finialHeight: 0.18,
    finialHeightRatio: 0.14,
    shaftTopRadiusRatio: 0.78,
    shaftBottomRadiusRatio: 0.82,
    capitalTopRadiusRatio: 0.98,
    capitalBottomRadiusRatio: 0.8,
    finialTopRadiusRatio: 0.3,
    finialBottomRadiusRatio: 0.62,
    sides: 8,
}

function stonePillar(parts, frame)
{
    const { size, matrix } = frame
    const design = CORAL_PILLAR
    const bottom = -size.y / 2
    const radius = Math.min(size.x, size.z) / 2
    const baseHeight = Math.min(design.baseHeight, size.y * design.baseHeightRatio)
    const capitalHeight = Math.min(design.capitalHeight, size.y * design.capitalHeightRatio)
    const finialHeight = Math.min(design.finialHeight, size.y * design.finialHeightRatio)
    const shaftHeight = size.y - baseHeight - capitalHeight - finialHeight
    const shaftBottom = bottom + baseHeight
    const capitalBottom = shaftBottom + shaftHeight
    const finialBottom = capitalBottom + capitalHeight

    parts.prism('stoneDark', radius, radius, baseHeight, {
        position: [0, bottom + baseHeight / 2, 0],
        matrix,
    }, design.sides)

    parts.prism(
        'sand',
        radius * design.shaftTopRadiusRatio,
        radius * design.shaftBottomRadiusRatio,
        shaftHeight,
        {
            position: [0, shaftBottom + shaftHeight / 2, 0],
            matrix,
        },
        design.sides,
    )

    parts.prism(
        'bunting1',
        radius * design.capitalTopRadiusRatio,
        radius * design.capitalBottomRadiusRatio,
        capitalHeight,
        {
            position: [0, capitalBottom + capitalHeight / 2, 0],
            matrix,
        },
        design.sides,
    )

    parts.prism(
        'sand',
        radius * design.finialTopRadiusRatio,
        radius * design.finialBottomRadiusRatio,
        finialHeight,
        {
            position: [0, finialBottom + finialHeight / 2, 0],
            matrix,
        },
        design.sides,
    )
}

const PINWHEEL = {
    radius: 0.44,
    centerY: 0.25,
    twist: 0.16,
    blades: ['bunting2', 'bunting1', 'bunting3', 'bunting5'],
    rotationStep: Math.PI / 2,
    positionItemSize: 3,
    hubRadius: 0.05,
    hubDepth: 0.08,
    hubZ: 0.04,
    hubSides: 6,
    poleRadius: 0.03,
    poleBottom: -0.65,
    poleZ: -0.03,
}

function pinwheelBlade(radius, twist)
{
    const root = [0, 0, 0]
    const edge = [radius, 0, 0]
    const tip = [radius, radius, twist]
    const geometry = new THREE.BufferGeometry()

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(
        [...root, ...edge, ...tip, ...root, ...tip, ...edge],
        PINWHEEL.positionItemSize,
    ))
    geometry.computeVertexNormals()

    return geometry
}

function pinwheel(parts)
{
    const { radius, centerY, twist, blades } = PINWHEEL

    blades.forEach((shade, index) =>
        parts.add(shade, pinwheelBlade(radius, twist), {
            position: [0, centerY, 0],
            rotation: [0, 0, index * PINWHEEL.rotationStep],
        }))

    parts.prism('bunting3', PINWHEEL.hubRadius, PINWHEEL.hubRadius, PINWHEEL.hubDepth, {
        position: [0, centerY, PINWHEEL.hubZ],
        rotation: [PINWHEEL.rotationStep, 0, 0],
    }, PINWHEEL.hubSides)

    parts.rod(
        'bamboo',
        PINWHEEL.poleRadius,
        [0, PINWHEEL.poleBottom, PINWHEEL.poleZ],
        [0, centerY, PINWHEEL.poleZ],
    )
}

const BUILDERS = [
    { pattern: /^gizmoPhysicalDynamic$/, build: (parts, container, materials) => placeGamepad(container, materials) },
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
    { pattern: /^refBallPhysicalDynamic$/, build: (parts, container) => beachBall(parts, collidersOf(container)[0]) },
]

const UNCOLLIDED_BUILDERS = [
    { pattern: /^sword$/, build: surfFlag },
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
    placeLandmarks(model, materials)
    for(const child of [...model.children])
    {
        const uncollided = UNCOLLIDED_BUILDERS.find((item) => item.pattern.test(child.name))
        if(uncollided && child.isMesh)
        {
            const frame = boundsFrame(child)
            const container = prepare(child)
            const parts = createParts()
            uncollided.build(parts, frame, { container, materials })
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

const PODIUM_BACKDROP = {
    front: -1.53,
    back: -1.58,
    bottom: -1,
    top: 3.53,
    halfDepth: 3.87,
    frame: 0.12,
    postWidth: 0.24,
    postFrontOffset: -0.08,
    postExtraHeight: 0.2,
    bindingWidth: 0.245,
    bindingHeight: 0.08,
    bindingTopInset: 0.25,
    roofCenterOffset: -0.1,
    roofRise: 0.26,
    roofHalfOffset: 0.2,
    roofSlopeWidth: 0.46,
    roofThickness: 0.08,
    roofAngle: Math.PI / 7,
    roofDepthOverhang: 0.58,
    ridgeWidth: 0.16,
    ridgeHeight: 0.1,
    ridgeRise: 0.4,
    ridgeDepthOverhang: 0.64,
}
const PODIUM_RANK_MARK = {
    width: 0.5,
    height: 0.08,
    gap: 0.16,
    availableHeightRatio: 0.6,
    topInset: 0.3,
    topInsetRatio: 0.3,
    widthRatio: 0.7,
    frontRecess: 0.024,
    frontRecessRatio: 0.06,
    depth: 0.02,
    depthRatio: 0.8,
    capHeight: 0.1,
    baseHeight: 0.06,
    baseHeightRatio: 0.1,
    shades: ['bunting3', 'bunting2', 'bunting4'],
}

function podiumStep(parts, frame, rank)
{
    const { size, matrix } = frame
    const style = PODIUM_RANK_MARK
    const top = size.y / 2
    const bottom = -size.y / 2
    const recess = Math.min(style.frontRecess, size.x * style.frontRecessRatio)
    const bodyWidth = size.x - recess
    const bodyX = -recess / 2
    const capHeight = Math.min(style.capHeight, size.y)
    const baseHeight = Math.min(style.baseHeight, size.y * style.baseHeightRatio)
    const gap = Math.min(style.gap, size.y * style.availableHeightRatio / Math.max(rank, 1))
    const markHeight = Math.min(style.height, gap / 2)
    const markWidth = Math.min(style.width, size.z * style.widthRatio)
    const markDepth = Math.min(style.depth, recess * style.depthRatio)
    const topInset = Math.min(style.topInset, size.y * style.topInsetRatio)
    const shadeIndex = Math.max(0, Math.min(rank - 1, style.shades.length - 1))

    parts.box('sand', [bodyWidth, size.y, size.z], {
        position: [bodyX, 0, 0],
        matrix,
    })
    parts.box('bunting1', [size.x, capHeight, size.z], {
        position: [0, top - capHeight / 2, 0],
        matrix,
    })
    parts.box('coconutShell', [bodyWidth, baseHeight, size.z], {
        position: [bodyX, bottom + baseHeight / 2, 0],
        matrix,
    })

    for(let index = 0; index < rank; index++)
    {
        parts.box(style.shades[shadeIndex], [markDepth, markHeight, markWidth], {
            position: [size.x / 2 - markDepth / 2, top - topInset - index * gap, 0],
            matrix,
        })
    }
}

function podiumBackdrop(parts)
{
    const style = PODIUM_BACKDROP
    const { front, back, bottom, top, halfDepth, frame } = style
    const postHeight = top - bottom + style.postExtraHeight
    const roofCenterX = front + style.roofCenterOffset
    const roofPanelDepth = (halfDepth * 2 + style.roofDepthOverhang) / 2

    parts.box('bunting1', [front - back, top - bottom, halfDepth * 2], {
        position: [(front + back) / 2, (top + bottom) / 2, 0],
    })

    for(const side of [-1, 1])
    {
        const postX = front + style.postFrontOffset
        const postZ = side * (halfDepth - frame)

        parts.box('bamboo', [style.postWidth, postHeight, frame * 2], {
            position: [postX, bottom + postHeight / 2, postZ],
        })
        parts.box('bunting3', [style.bindingWidth, style.bindingHeight, style.bindingWidth], {
            position: [postX, top - style.bindingTopInset, postZ],
        })

        for(const row of [-1, 1])
        {
            parts.box('palmLeaf', [style.roofSlopeWidth, style.roofThickness, roofPanelDepth], {
                position: [
                    roofCenterX + side * style.roofHalfOffset,
                    top + style.roofRise,
                    row * roofPanelDepth / 2,
                ],
                rotation: [0, 0, -side * style.roofAngle],
            })
        }
    }

    parts.box('thatch', [style.ridgeWidth, style.ridgeHeight, halfDepth * 2 + style.ridgeDepthOverhang], {
        position: [roofCenterX, top + style.ridgeRise, 0],
    })
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

const BYEOTGARI = {
    radius: 0.68,
    bottom: -1.01,
    height: 1.46,
    columns: [
        [-24.75, -0.65],
        [-26.68, -2.5],
        [-25.57, -1.66],
        [0.1, 13.81],
        [-1.57, 11.63],
        [-0.72, 12.81],
    ],
    sides: 8,
    flameSides: 5,
    baseHeightRatio: 0.11,
    baseTopRadiusRatio: 0.74,
    shaftBottomRatio: 0.08,
    shaftHeightRatio: 0.7,
    shaftTopRadiusRatio: 0.2,
    shaftBottomRadiusRatio: 0.24,
    bindingRadiusRatio: 0.26,
    bindingHeightRatio: 0.04,
    bindingLevels: [0.28, 0.58],
    bowlBottomRatio: 0.72,
    bowlHeightRatio: 0.16,
    bowlTopRadiusRatio: 0.54,
    bowlBottomRadiusRatio: 0.25,
    flameBottomRatio: 0.85,
    flameHeightRatio: 0.37,
    flameRadiusRatio: 0.32,
    innerFlameHeightRatio: 0.25,
    innerFlameRadiusRatio: 0.21,
    innerFlameOffsetRatio: 0.08,
}

function byeotgari(parts)
{
    const style = BYEOTGARI
    const { radius, bottom, height, columns } = style
    const baseHeight = height * style.baseHeightRatio
    const shaftHeight = height * style.shaftHeightRatio
    const bowlHeight = height * style.bowlHeightRatio
    const flameHeight = height * style.flameHeightRatio
    const innerFlameHeight = height * style.innerFlameHeightRatio

    for(const [x, z] of columns)
    {
        parts.prism('sand', radius * style.baseTopRadiusRatio, radius, baseHeight, {
            position: [x, bottom + baseHeight / 2, z],
        }, style.sides)

        parts.prism(
            'bamboo',
            radius * style.shaftTopRadiusRatio,
            radius * style.shaftBottomRadiusRatio,
            shaftHeight,
            { position: [x, bottom + height * style.shaftBottomRatio + shaftHeight / 2, z] },
            style.sides,
        )

        for(const level of style.bindingLevels)
        {
            parts.prism(
                'thatchRope',
                radius * style.bindingRadiusRatio,
                radius * style.bindingRadiusRatio,
                height * style.bindingHeightRatio,
                { position: [x, bottom + height * level, z] },
                style.sides,
            )
        }

        parts.prism(
            'coconutShell',
            radius * style.bowlTopRadiusRatio,
            radius * style.bowlBottomRadiusRatio,
            bowlHeight,
            { position: [x, bottom + height * style.bowlBottomRatio + bowlHeight / 2, z] },
            style.sides,
        )

        parts.prism('bunting3', 0, radius * style.flameRadiusRatio, flameHeight, {
            position: [x, bottom + height * style.flameBottomRatio + flameHeight / 2, z],
        }, style.flameSides)

        parts.prism('bunting2', 0, radius * style.innerFlameRadiusRatio, innerFlameHeight, {
            position: [
                x + radius * style.innerFlameOffsetRatio,
                bottom + height * style.flameBottomRatio + innerFlameHeight / 2,
                z,
            ],
        }, style.flameSides)
    }
}

const ANGBUILGU = {
    baseSize: [0.9, 0.55, 0.9],
    collarRadius: 0.5,
    collarHeight: 0.08,
    collarY: 0.59,
    sides: 12,
    shellProfile: [
        [0, 0.63],
        [0.25, 0.69],
        [0.43, 0.87],
        [0.53, 1.08],
        [0.56, 1.22],
        [0.5, 1.22],
        [0.46, 1.08],
        [0.3, 0.9],
        [0, 0.86],
    ],
    dialRadius: 0.29,
    dialHeight: 0.03,
    dialY: 0.89,
    needleY: 0.915,
    needleLength: 0.28,
    needleHalfWidth: 0.075,
    markerRadius: 0.51,
    markerSize: [0.06, 0.035, 0.09],
    markerY: 1.22,
    markerAngles: [0, Math.PI / 2, Math.PI, Math.PI * 1.5],
    needleShades: ['bunting2', 'bunting3'],
    pinRadius: 0.035,
    pinHeight: 0.13,
    pinY: 0.975,
    pinSides: 6,
}

function angbuilgu(parts)
{
    const style = ANGBUILGU
    const center = CIRCUIT_DECORATION.clock.getCenter(new THREE.Vector3())
    const bottom = CIRCUIT_DECORATION.clock.min.y

    parts.box('sand', style.baseSize, {
        position: [center.x, bottom + style.baseSize[1] / 2, center.z],
    })
    parts.prism('bunting1', style.collarRadius, style.collarRadius, style.collarHeight, {
        position: [center.x, bottom + style.collarY, center.z],
    }, style.sides)

    lathe(
        parts,
        'bunting4',
        style.shellProfile.map(([radius, y]) => [radius, bottom + y]),
        { position: [center.x, 0, center.z] },
        style.sides,
    )

    parts.prism('bunting1', style.dialRadius, style.dialRadius, style.dialHeight, {
        position: [center.x, bottom + style.dialY, center.z],
    }, style.sides)

    for(const [index, shade] of style.needleShades.entries())
    {
        const direction = index === 0 ? -1 : 1
        const geometry = new THREE.BufferGeometry()

        geometry.setAttribute('position', new THREE.Float32BufferAttribute([
            0, 0, direction * style.needleLength,
            -style.needleHalfWidth, 0, 0,
            style.needleHalfWidth, 0, 0,
        ], 3))
        geometry.setIndex(direction < 0 ? [0, 1, 2] : [0, 2, 1])
        geometry.computeVertexNormals()

        parts.add(shade, geometry, {
            position: [center.x, bottom + style.needleY, center.z],
        })
    }

    for(const angle of style.markerAngles)
    {
        parts.box('bunting3', style.markerSize, {
            position: [
                center.x + Math.sin(angle) * style.markerRadius,
                bottom + style.markerY,
                center.z + Math.cos(angle) * style.markerRadius,
            ],
            rotation: [0, angle, 0],
        })
    }

    parts.prism('bronze', style.pinRadius, style.pinRadius, style.pinHeight, {
        position: [center.x, bottom + style.pinY, center.z],
    }, style.pinSides)
}

const HONGSALMUN = {
    postX: [-14.2, -0.5],
    z: -16.32,
    bottom: -1,
    lowerBeam: 3.72,
    upperBeam: 4.2,
    slatTop: 4.95,
    slatGap: 0.55,
    sides: 8,
    baseTopRadius: 0.32,
    baseBottomRadius: 0.36,
    baseHeight: 0.3,
    postTopRadius: 0.18,
    postBottomRadius: 0.2,
    bindingRadius: 0.205,
    bindingHeight: 0.08,
    bindingLevels: [0.55, 2.6],
    beamRadius: 0.09,
    beamOverhang: 0.5,
    beamRotation: Math.PI / 2,
    jointRadius: 0.112,
    jointWidth: 0.06,
    flagWidth: 0.34,
    flagHeight: 0.28,
    flagDepthOffset: 0.12,
    flagShades: ['bunting1', 'bunting2', 'bunting3', 'bunting4', 'bunting5'],
    flowerTopInset: 0.23,
    flowerDepthOffset: 0.23,
    flowerOrbit: 0.12,
    flowerPetalRadius: 0.095,
    flowerCenterRadius: 0.065,
    flowerDepth: 0.04,
    flowerCenterDepthOffset: 0.025,
    flowerPetals: 5,
    flowerSides: 5,
    fullTurn: Math.PI * 2,
}

function hongsalmun(parts)
{
    const style = HONGSALMUN
    const { postX, z, bottom, lowerBeam, upperBeam, slatTop, slatGap } = style
    const [left, right] = postX
    const width = right - left
    const centerX = (left + right) / 2

    for(const x of postX)
    {
        parts.prism('sand', style.baseTopRadius, style.baseBottomRadius, style.baseHeight, {
            position: [x, bottom + style.baseHeight / 2, z],
        }, style.sides)

        parts.prism('bamboo', style.postTopRadius, style.postBottomRadius, slatTop - bottom, {
            position: [x, (slatTop + bottom) / 2, z],
        }, style.sides)

        for(const level of style.bindingLevels)
        {
            parts.prism('thatchRope', style.bindingRadius, style.bindingRadius, style.bindingHeight, {
                position: [x, bottom + level, z],
            }, style.sides)
        }
    }

    for(const y of [lowerBeam, upperBeam])
    {
        parts.prism('bamboo', style.beamRadius, style.beamRadius, width + style.beamOverhang, {
            position: [centerX, y, z],
            rotation: [0, 0, style.beamRotation],
        }, style.sides)
    }

    for(let index = 0; ; index++)
    {
        const x = left + slatGap * (index + 1)
        if(x >= right - slatGap / 2)
            break

        parts.prism('thatchRope', style.jointRadius, style.jointRadius, style.jointWidth, {
            position: [x, upperBeam, z],
            rotation: [0, 0, style.beamRotation],
        }, style.sides)

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([
            -style.flagWidth / 2, 0, 0,
            0, -style.flagHeight, 0,
            style.flagWidth / 2, 0, 0,
        ], 3))
        geometry.setIndex([0, 1, 2, 2, 1, 0])
        geometry.computeVertexNormals()

        parts.add(style.flagShades[index % style.flagShades.length], geometry, {
            position: [x, upperBeam - style.beamRadius, z + style.flagDepthOffset],
        })
    }

    for(const [postIndex, x] of postX.entries())
    {
        const flowerY = slatTop - style.flowerTopInset
        const petalShade = postIndex === 0 ? 'bunting2' : 'bunting4'

        for(let petal = 0; petal < style.flowerPetals; petal++)
        {
            const angle = style.fullTurn * petal / style.flowerPetals

            parts.prism(petalShade, style.flowerPetalRadius, style.flowerPetalRadius, style.flowerDepth, {
                position: [
                    x + Math.cos(angle) * style.flowerOrbit,
                    flowerY + Math.sin(angle) * style.flowerOrbit,
                    z + style.flowerDepthOffset,
                ],
                rotation: [style.beamRotation, 0, 0],
            }, style.flowerSides)
        }

        parts.prism('bunting3', style.flowerCenterRadius, style.flowerCenterRadius, style.flowerDepth, {
            position: [
                x,
                flowerY,
                z + style.flowerDepthOffset + style.flowerCenterDepthOffset,
            ],
            rotation: [style.beamRotation, 0, 0],
        }, style.flowerSides)
    }
}

const DANCER_CHEST = {
    bodySize: [1.2, 0.9, 1.2],
    bodyY: -0.5,
    lidSize: [1.3, 0.12, 1.3],
    lidY: -0.02,
    baseSize: [1.32, 0.12, 1.32],
    baseY: -0.9,
    strapSize: [1.22, 0.76, 0.06],
    strapOffset: 0.33,
    claspSize: [0.05, 0.18, 0.22],
    claspX: 0.615,
    claspY: -0.4,
}

function dancerChest(parts)
{
    const style = DANCER_CHEST

    for(const [x, z] of CIRCUIT_DECORATION.dancerBases)
    {
        parts.box('coconutShell', style.bodySize, {
            position: [x, style.bodyY, z],
        })
        parts.box('bunting1', style.lidSize, {
            position: [x, style.lidY, z],
        })
        parts.box('sand', style.baseSize, {
            position: [x, style.baseY, z],
        })

        for(const side of [-1, 1])
        {
            parts.box('bunting3', style.strapSize, {
                position: [x, style.bodyY, z + side * style.strapOffset],
            })
        }

        parts.box('bunting2', style.claspSize, {
            position: [x + style.claspX, style.claspY, z],
        })
    }
}

const BANNER_STAND = {
    baseSize: [1.2, 0.2, 1.2],
    baseY: -0.9,
    collarSize: [0.5, 0.16, 0.5],
    collarY: -0.72,
    shaftTopRadius: 0.07,
    shaftBottomRadius: 0.08,
    shaftHeight: 1.35,
    shaftY: -0.14,
    crossbarRadius: 0.04,
    crossbarLength: 0.52,
    crossbarY: 0.42,
    crossbarRotation: Math.PI / 2,
    flagSize: [0.025, 0.52, 0.42],
    flagX: 0.06,
    flagY: 0.14,
    hemSize: [0.027, 0.06, 0.42],
    hemY: -0.09,
    sides: 6,
    shades: ['bunting2', 'bunting1'],
}

function bannerStand(parts)
{
    const style = BANNER_STAND

    for(const [index, [x, z]] of CIRCUIT_DECORATION.bannerStands.entries())
    {
        parts.box('sand', style.baseSize, {
            position: [x, style.baseY, z],
        })
        parts.box('bunting1', style.collarSize, {
            position: [x, style.collarY, z],
        })
        parts.prism('bamboo', style.shaftTopRadius, style.shaftBottomRadius, style.shaftHeight, {
            position: [x, style.shaftY, z],
        }, style.sides)
        parts.prism('bamboo', style.crossbarRadius, style.crossbarRadius, style.crossbarLength, {
            position: [x, style.crossbarY, z],
            rotation: [style.crossbarRotation, 0, 0],
        }, style.sides)
        parts.box(style.shades[index % style.shades.length], style.flagSize, {
            position: [x + style.flagX, style.flagY, z],
        })
        parts.box('bunting3', style.hemSize, {
            position: [x + style.flagX, style.hemY, z],
        })
    }
}

const TENT_POLE = {
    topRadius: 0.07,
    bottomRadius: 0.09,
    bindingRadiusRatio: 0.98,
    bindingHeight: 0.06,
    bindingHeightRatio: 0.12,
    bindingLevel: 0.6,
    sides: 6,
}

function tentPole(parts, box)
{
    const style = TENT_POLE
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const height = box.max.y - box.min.y
    const radius = Math.min(style.bottomRadius, size.x / 2, size.z / 2)
    const topRadius = radius * style.topRadius / style.bottomRadius
    const bindingRadius = radius * style.bindingRadiusRatio
    const bindingHeight = Math.min(style.bindingHeight, height * style.bindingHeightRatio)

    parts.prism('bamboo', topRadius, radius, height, {
        position: center.toArray(),
    }, style.sides)

    parts.prism('thatchRope', bindingRadius, bindingRadius, bindingHeight, {
        position: [center.x, box.min.y + height * style.bindingLevel, center.z],
    }, style.sides)
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

export const COCONUT_SIZE = new THREE.Vector3(0.55, 0.48, 0.5)

export function makeCoconut(cookie, materials)
{
    const coconut = islandModelMesh(materials, 'coconut', new THREE.Matrix4(), COCONUT_SIZE)
    cookie.geometry = coconut.geometry
    cookie.material = coconut.material
}
